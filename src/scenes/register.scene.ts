import {composeWizardScene} from "../helpers/scene.servise";
import {logger} from "../helpers/logger";
import {getDomain} from "../helpers/domain.service";
import {Markup} from "telegraf";

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
}

const socials = [
    'youtube',
    'vk',
    'telegram',
    'inst'
]

const social_names = {
    youtube: 'Ютуб',
    vk: 'Вконтакте',
    telegram: 'Телеграм',
    inst: 'Инстаграм',
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

        ctx.reply("Подтвердите регистрацию", {
            reply_markup: {
                keyboard: [
                    [
                        {
                            text: "Подтвердить регистрацию",
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
        if (ctx.message.contact) {
            if (ctx.message.contact.phone_number) {
                ctx.wizard.state.user_data.phone = ctx.message.contact.phone_number;
                const res = await storePhone(ctx.message.contact.phone_number, ctx.message.chat.id);
                console.log(res);
                if (!res) {
                    ctx.reply('Пользователь с таким номером уже зарегистрирован.');
                    return ctx.scene.leave();
                }
            }
        }

        ctx.reply('Привет! Для начала регистрации в нашем сервисе, пожалуйста, напишите свое имя.');
        return ctx.wizard.next();
    },
    (ctx) => {
        ctx.wizard.state.user_data.name = ctx.message.text;
        if (ctx.wizard.state.email_error) {
            ctx.reply('Некорректный формат, введите адрес существующей электронной почты.');
        } else {
            ctx.reply('Спасибо! Теперь укажите ваш адрес электронной почты для создания аккаунта');
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
            let text = 'Прекрасно! Теперь выберите соц.сеть, в которой у вас есть блог, и нажмите на кнопку ниже. (Вконтакте; Телеграм; Ютуб; Инстаграм;):';
            if (ctx.wizard.state.user_data.socials.length !== 0) {
                text = 'Выберите соц.сеть, в которой у вас есть блог, и нажмите на кнопку ниже.';
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
                    ctx.reply(`Некорректный формат ссылки, введите корректную ссылку на ваш блог в ${social_names[ctx.wizard.state.selected_social]}:`);
                } else {
                    ctx.reply(`Отлично, теперь отправьте сообщением ссылку на ваш блог в ${social_names[ctx.wizard.state.selected_social]}:`);
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
                console.log(ctx.wizard.state.user_data.socials);
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
            const new_phone = ctx.wizard.state.user_data.phone.replace("+", "\\+");

            ctx.reply(`Ваш профиль был успешно создан на нашем сервисе lk\\.adswap\\.ru\\. Для входа в систему используйте следующие учетные данные: \n\nТелефон: \`${new_phone}\`\nПароль: \`${user.password}\``, {
                parse_mode: 'MarkdownV2',
                reply_markup: Markup.inlineKeyboard([
                    Markup.button.url('Перейти на сайт', 'https://lk.adswap.ru?token' + user.token)
                ])
            });
        } else {
            ctx.reply(`Произошла ошибка при регистрации попробуйте ещё раз позже или обратитесь в службу поддержки`);
        }
        ctx.wizard.next()
        return done();
    },
);

async function storePhone(phone: string, chatId: number) {
    const domain = getDomain();
    const response = await fetch(domain + '/apist/tg', {
        method: 'POST',
        headers: {
            'content-type': 'application/json;charset=UTF-8',
        },
        body: JSON.stringify({
            phone: phone,
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
    console.log(user);
    const response = await fetch(domain + '/api/users', {
        method: 'POST',
        headers: {
            'content-type': 'application/json;charset=UTF-8',
        },
        body: JSON.stringify(user),
    })

    if (response.ok) {
        const parsed_response = await response.json()
        return { password: user.password,  token: parsed_response.token};
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
    try {
        // Даже URL-адреса нуждаются в проверке
        return !!new URL(str);
    } catch (_) {
        // Если URL оказался некорректным
        return false;
    }
};