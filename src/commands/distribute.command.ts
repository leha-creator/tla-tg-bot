import { Telegraf } from "telegraf";
import { Command } from "./command.class";
import { IBotContext } from "../context/context.interface";
import { AdminService } from "../helpers/admin.service";
import {getDomain} from "../helpers/domain.service";
import {logger} from "../helpers/logger";

export class ListCommnds extends Command {
    constructor(bot: Telegraf<IBotContext>, public adminService: AdminService) {
        super(bot);
    }

    handle(): void {
        this.bot.command('list', async (ctx) => {
            if (!this.adminService.isAdmin(ctx.message.from.id)) {
                return ctx.reply(`Недостаточно прав`);
            }

            if (ctx.message.reply_to_message == undefined) {
                return ctx.reply(`Команда должна вызываться ответом на сообщение`);
            }

            const data = {
                message_id: ctx.message.reply_to_message.message_id,
                from_chat_id: ctx.message.chat.id,
            }

            const domain = getDomain();
            const response = await fetch(domain + '/distribute', {
                method: 'POST',
                headers: {
                    'content-type': 'application/json;charset=UTF-8',
                },
                body: JSON.stringify(data),
            })

            if (response.ok) {
                ctx.reply('Рассылка запущена')
            } else {
                ctx.reply('Ошибка рассылки')
                const result = await response.text()
                logger.info(result);
                return false;
            }
        });
    }
}