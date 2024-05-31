import { Telegraf } from "telegraf";
import { Command } from "./command.class";
import { IBotContext } from "../context/context.interface";
import { AdminService } from "../helpers/admin.service";
import { logger } from "../helpers/logger";

export class MessageCommnds extends Command {
    constructor(bot: Telegraf<IBotContext>, public adminService: AdminService) {
        super(bot);
    }

    handle(): void {
        this.bot.on('message', (ctx) => {
            this.forwardToAdmin(ctx);
        });
    }

    forwardToAdmin(ctx: IBotContext) {
        console.log(ctx.message.chat);
        if (ctx.message.contact) {
            if (ctx.message.contact.phone_number) {
                this.fetchPhone(ctx.message.contact.phone_number, ctx.message.chat.id)
                ctx.reply('Подтверждение прошло успешно!')
             } else {
                 ctx.reply('Возникла ошибка при получении контакта, попробуйте ещё раз!')
             }
        } else {
        }
        
    };

    async fetchPhone(phone: string, chatId: number) {
        const response = await fetch('http://h406133820.nichost.ru/apist/tg', {
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
            const { data, errors } = await response.json()
            return true;
        } else {
            console.log(await response.text())
            return false;
        }
    }
}