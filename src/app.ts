import { Telegraf, Markup } from "telegraf";
import { IConfigServise } from "./config/config.interface";
import { ConfigServise } from "./config/config.servise";
import { IBotContext } from "./context/context.interface";
import { Command } from "./commands/command.class";
import { StartCommnds } from "./commands/start.command";
import LocalSession from "telegraf-session-local";
import { logger } from "./helpers/logger";
import { AdminService } from "./helpers/admin.service";
import { MessageCommnds } from "./commands/message.command";
import { ListCommnds } from "./commands/list.command";
import { ModCommnds } from "./commands/mod.command";
import { UnmodCommnds } from "./commands/unmod.command";
import express from "express";

class Bot {
    bot: Telegraf<IBotContext>;
    commands: Command[] = [];
    constructor(private readonly configServise: IConfigServise) {
        this.bot = new Telegraf<IBotContext>(this.configServise.get('TOKEN'));
        this.bot.use(
            new LocalSession({ database: 'sessions.json' }).middleware()
        );
    }

    init() {
        this.commands = [
            new StartCommnds(this.bot, adminService),
            new ListCommnds(this.bot, adminService),
            new ModCommnds(this.bot, adminService),
            new UnmodCommnds(this.bot, adminService),
            new MessageCommnds(this.bot, adminService),
        ];
        for (const command of this.commands) {
            command.handle();
        }

        this.bot.launch();
    }
}

const configServise = new ConfigServise();
const bot = new Bot(configServise);
const adminService = AdminService.getInstance();

const expressApp = express();
const port = 80;
expressApp.use(express.json())
expressApp.post('/reset-password', (request, response) => {
    if (!request.body.chatId) {
        response.statusCode = 400;
        response.json({ "error": { chatId: "chatId is required" } });
    }

    if (!request.body.newPassword) {
        response.statusCode = 400;
        response.json({ "newPassword": { chatId: "newPassword is required" } });
    }

    let text = `Запрос на смену пароля\nЕсли это были не вы, обратесь в службу поддержки\n\nНовый пароль: ||${request.body.newPassword}||\n\nПароль можно сменить в найстроках профиля`;
    bot.bot.telegram.sendMessage(request.body.chatId, text, {parse_mode: 'MarkdownV2'})
    response.statusCode = 200;
    response.json("success");
});

expressApp.get('/test', (request, response) => {
    console.log('test');
    response.json("success");
});

expressApp.post('/notify', (request, response) => {
    console.log(request)
    if (!request.body.chatId) {
        response.statusCode = 400;
        response.json({ "error": { chatId: "chatId is required" } });
        console.log({ "error": { chatId: "chatId is required" } })
    }

    if (!request.body.text) {
        response.statusCode = 400;
        response.json({ "text": { chatId: "text is required" } });
        console.log({ "text": { chatId: "text is required" } })
    }

    let link = 'http://h406133820.nichost.ru/';

    if (request.body.link) {
        link = request.body.link;
    }
    bot.bot.telegram.sendMessage(request.body.chatId, request.body.text, Markup.inlineKeyboard([
        Markup.button.url('Посмотреть на сайте', link)
   ]))

    response.statusCode = 200;
    response.json("success");
});

expressApp.post('/notify-admin', (request, response) => {
    if (!request.body.text) {
        response.statusCode = 400;
        response.json({ "text": { chatId: "text is required" } });
        console.log({ "text": { chatId: "text is required" } })
    }
    const adminService = AdminService.getInstance();
    const admins = adminService.getAdmins();
    admins.forEach(id => {
        bot.bot.telegram.sendMessage(id, request.body.text);
    });

    response.statusCode = 200;
    response.json("success");
});

const start = async () => {
    bot.init();
    logger.info('app started');
    expressApp.listen(port, () => console.log(`Running on port ${port}`));
};

start();

