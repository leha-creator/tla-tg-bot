import {Telegraf} from "telegraf";
import {Command} from "./command.class";
import {IBotContext} from "../context/context.interface";
import {AdminService} from "../helpers/admin.service";
import {logger} from "../helpers/logger";

export class StartCommnds extends Command {
    constructor(bot: Telegraf<IBotContext>, public adminService: AdminService) {
        super(bot);
    }

    handle(): void {
        this.bot.start((ctx: any) => {
            const parameters = ctx.update.message.text.split(' ');
            ctx.session.ref_code = parameters[1] ?? 0;
            try {
                ctx.reply(`Привет\\! 👋

Это бот для регистрации в Adswap: платформе бартерной рекламы для селлеров и блогеров 🚀

👥 Для **селлеров** Adswap поможет:

✅ Организовать рекламные кампании по бартеру  
✅ Повысить рейтинг товаров и собирать положительные отзывы  
✅ Привлекать неограниченное количество внешнего трафика  
✅ Наращивать продажи и укреплять лояльность аудитории  

👤 Для **блогеров** Adswap предлагает:

✅ Получать товары на обзор совершенно бесплатно  
✅ Увеличивать охваты и разнообразить контент  
✅ Привлекать новых рекламодателей, подходящих вашей аудитории  
✅ Повышать свою экспертность и узнаваемость  

🎁 Регистрируйтесь прямо сейчас 👇 и получите 30 дней бесплатного доступа и 5 бартеров в подарок каждому новому пользователю\\!

По любым вопросам — напишите [нам](https://t.me/adswap_admin) 👈

Регистрируясь на платформе, вы даете согласие на обработку персональных данных, а также подтверждаете ознакомление с [пользовательским соглашением](https://adswap.ru/privacy) и [политикой конфиденциальности](https://adswap.ru/agreement)\\.
`, {
                    reply_markup: {
                        inline_keyboard: [
                            [{text: "Зарегистрироваться", callback_data: "enter_register"}],
                        ],
                    },
                    parse_mode: 'MarkdownV2',
                    disable_web_page_preview: true,
                });
            } catch (e: any) {
                logger.info(e.message);
            }
        });
    }
}