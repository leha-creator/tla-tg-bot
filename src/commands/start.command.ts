import { Markup, Telegraf } from "telegraf";
import { Command } from "./command.class";
import { IBotContext } from "../context/context.interface";
import { AdminService } from "../helpers/admin.service";

export class StartCommnds extends Command {
    constructor(bot: Telegraf<IBotContext>, public adminService: AdminService) {
        super(bot);
    }

    handle(): void {
        this.bot.start((ctx) => {
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
              })
        });
    }
}