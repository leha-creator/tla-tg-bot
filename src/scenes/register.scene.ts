import {composeWizardScene} from "../helpers/scene.servise";
import {logger} from "../helpers/logger";
import {getDomain} from "../helpers/domain.service";

interface ISocial {
    name: string,
    link: string,
}

interface IKeyboardElement {
    text: string,
    callback_data: string
}

interface IUser {
    name: string | null,
    phone: string | null,
    email: string | null,
    role: string | null,
    password: string | null
    socials: ISocial[],
    platforms: ISocial[],
}

const socials = [
    'Youtube',
    'VK',
    'Telegram',
    'Instagram'
]

const social_names = {
    Youtube: 'Ютуб',
    VK: 'Вконтакте',
    Telegram: 'Телеграм',
    Instagram: 'Инстаграм',
}

export const registerScene = composeWizardScene(
    (ctx) => {
        ctx.wizard.state.selected_social = null;
        ctx.wizard.state.selected_social_link = null;
        ctx.wizard.state.email_error = false;
        ctx.wizard.state.link_error = false;
        ctx.wizard.state.user_data = {
            name: null,
            email: null,
            phone: null,
            role: null,
            password: null,
            socials: [],
        };

        ctx.reply("Для регистрации нажмите на кнопку \"📱Отправить телефон\" в меню бота", {
            reply_markup: {
                keyboard: [
                    [
                        {
                            text: "Отправить телефон",
                            request_contact: true,
                        },
                    ],
                ],
                one_time_keyboard: true,
            },
        });

        return ctx.wizard.next();
    },
    async (ctx) => {
        if (typeof ctx.message.contact !== 'undefined') {
            if (ctx.message.contact.phone_number) {
                ctx.wizard.state.user_data.phone = ctx.message.contact.phone_number;
                const res = await storePhone(ctx.message.contact.phone_number, ctx.message.chat.id, ctx.message.from.username);
                if (!res) {
                    ctx.reply('Пользователь с таким номером уже зарегистрирован.');
                    return ctx.scene.leave();
                }
            }
        } else {
            ctx.wizard.cursor = ctx.wizard.cursor - 1;
            return ctx.wizard.steps[ctx.wizard.cursor](ctx);
        }

        ctx.reply('Спасибо, теперь напишите свое имя');
        return ctx.wizard.next();
    },
    (ctx) => {
        ctx.wizard.state.user_data.name = ctx.message.text;
        if (ctx.wizard.state.email_error) {
            ctx.reply('Проверьте правильность ввода email');
        } else {
            ctx.reply('Спасибо, теперь напишите свой email');
        }

        return ctx.wizard.next();
    },
    (ctx) => {
        if (ctx.wizard.state.user_data.email == null && !isEmailValid(ctx.message.text)) {
            ctx.wizard.state.email_error = true;
            ctx.wizard.cursor = ctx.wizard.cursor - 1;
            return ctx.wizard.steps[ctx.wizard.cursor](ctx);
        }

        ctx.wizard.state.email_error = false;
        ctx.wizard.state.user_data.email = ctx.message.text;
        ctx.reply('Выберите роль:', {
            reply_markup: {
                inline_keyboard: [
                    [{text: "Селлер", callback_data: "seller"}],
                    [{text: "Блоггер", callback_data: "blogger"}],
                    [{text: "Агенство", callback_data: "agent"}]
                ]
            }
        });

        return ctx.wizard.next();
    },
    (ctx) => {
        if (ctx.wizard.state.user_data.role === null) {
            ctx.wizard.cursor = ctx.wizard.cursor - 1;
            return ctx.wizard.steps[ctx.wizard.cursor](ctx);
        }
        if (ctx.wizard.state.user_data.role === 'blogger') {
            const keyboard: IKeyboardElement[][] = [];
            socials.forEach(social => {
                if (!ctx.wizard.state.user_data.socials.find(({name}) => name === social)) {
                    keyboard.push([{
                        text: social_names[social],
                        callback_data: social,
                    }]);
                }
            })
            let text = 'Выберите соцсеть:';
            if (ctx.wizard.state.user_data.socials.length !== 0) {
                text = 'Выберите соцсеть';
                keyboard.push([{
                    text: 'Назад',
                    callback_data: 'skip_social',
                }]);
            }
            ctx.reply(text, {
                reply_markup: {
                    inline_keyboard: keyboard
                }
            });
        } else {
            return ctx.wizard.steps[7](ctx);
        }

        return ctx.wizard.next();
    },
    (ctx) => {
        if (ctx.wizard.state.user_data.role === 'blogger') {
            if (typeof ctx.update !== 'undefined') {
                if (ctx.wizard.state.link_error) {
                    ctx.reply(`Проверьте правильность ввода ссылки`);
                } else {
                    ctx.reply(`Отправьте ссылку на ${social_names[ctx.wizard.state.selected_social]}`);
                }
            } else {
                ctx.wizard.state.link_error = true;
                ctx.wizard.cursor = ctx.wizard.cursor - 1;
                return ctx.wizard.steps[ctx.wizard.cursor](ctx);
            }
        }

        return ctx.wizard.next();
    },
    (ctx) => {
        if (ctx.wizard.state.user_data.role === 'blogger') {
            if (typeof ctx.message !== 'undefined') {
                if (!isValidUrl(ctx.message.text)) {
                    ctx.wizard.state.link_error = true;
                    ctx.wizard.cursor = ctx.wizard.cursor - 1;
                    return ctx.wizard.steps[ctx.wizard.cursor](ctx);
                }

                ctx.wizard.state.link_error = false;
                ctx.wizard.state.user_data.socials.push({
                    name: ctx.wizard.state.selected_social,
                    link: ctx.message.text
                })
                ctx.reply(`Ваш блог в ${social_names[ctx.wizard.state.selected_social]} успешно добавлен! Хотите указать ещё один блог?(Да/нет):`, {
                    reply_markup: {
                        inline_keyboard: [
                            [{text: "Да", callback_data: "add_social"}, {text: "Нет", callback_data: "skip_social"}],
                        ]
                    }
                });
            } else {
                ctx.wizard.state.email_error = true;
                ctx.wizard.cursor = ctx.wizard.cursor - 1;
                return ctx.wizard.steps[ctx.wizard.cursor](ctx);
            }
        }

        return ctx.wizard.next();
    },

    async (ctx, done: () => any) => {
        const user = await storeUser(ctx.wizard.state.user_data);
        if (user) {
            if (ctx.wizard.state.user_data.role === 'blogger') {
                ctx.reply(`Спасибо\\! Ваш аккаунт находится в модерации\\. После вашего одобрения мы отправим вам данные для входа`, {
                    parse_mode: 'MarkdownV2',
                });
            } else {
                const new_phone = ctx.wizard.state.user_data.phone.replace("+", "\\+");
                const domain = getDomain();
                ctx.reply(`🔑 Данные для доступа к сервису

Ссылка для входа: https://lk\\.adswap\\.ru/
Логин: \`${new_phone}\`
Пароль: \`${user.password}\`

Авторизуйтесь в сервисе и посмотрите раздел [инструкции](https://adswap.ru/instructions)\\.
Если у вас остались вопросы, напишите нам в чат поддержки по [ссылке](https://t.me/adswap_admin)\\.`, {
                    parse_mode: 'MarkdownV2',
                    reply_markup: {
                        inline_keyboard: [
                            [ { text: "Перейти на сайт", url:  domain + '?token=' + user.token } ],
                        ]
                    }
                });
            }
        } else {
            ctx.reply(`Произошла ошибка при регистрации попробуйте ещё раз позже или обратитесь в службу поддержки`);
        }

        ctx.wizard.next()
        return done();
    },
);

async function storePhone(phone: string, chatId: number, username: string) {
    const domain = getDomain();
    const response = await fetch(domain + '/api/phones', {
        method: 'POST',
        headers: {
            'content-type': 'application/json;charset=UTF-8',
        },
        body: JSON.stringify({
            phone: phone,
            username: username,
            chat_id: chatId
        }),
    })

    if (response.ok) {
        return true;
    } else {
        const result = await response.text()
        logger.info(result);
        return false;
    }
}

async function storeUser(user: IUser) {
    const domain = getDomain();
    user.password = generateRandomString(16);
    user.platforms = user.socials;
    const response = await fetch(domain + '/api/users', {
        method: 'POST',
        headers: {
            'content-type': 'application/json;charset=UTF-8',
        },
        body: JSON.stringify(user),
    })

    if (response.ok) {
        const parsed_response = await response.json()
        return {password: user.password, token: parsed_response.token};
    } else {
        const result = await response.text()
        logger.info(result);
        return false;
    }
}

function generateRandomString(length: number) {
    return Math.random().toString(36).substring(2, length + 2);
}

function isEmailValid(value: string) {
    const EMAIL_REGEXP = /^(([^<>()[\].,;:\s@"]+(\.[^<>()[\].,;:\s@"]+)*)|(".+"))@(([^<>()[\].,;:\s@"]+\.)+[^<>()[\].,;:\s@"]{2,})$/iu;
    return EMAIL_REGEXP.test(value);
}

const isValidUrl = (str) => {
    const pattern = new RegExp('^(https?:\\/\\/)?' + // protocol
        '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
        '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
        '(\\:\\d+)?(\\/[-a-z\\d@%_.~+]*)*' + // port and path
        '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
        '(\\#[-a-z\\d_]*)?$', 'i'); // fragment locator
    return pattern.test(str);
};