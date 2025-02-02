import {Telegraf, Markup} from "telegraf";
import {IConfigServise} from "./config/config.interface";
import {ConfigService} from "./config/configService";
import {IBotContext} from "./context/context.interface";
import {Command} from "./commands/command.class";
import {StartCommnds} from "./commands/start.command";
import LocalSession from "telegraf-session-local";
import {logger} from "./helpers/logger";
import {AdminService} from "./helpers/admin.service";
import {ListCommnds} from "./commands/list.command";
import {ModCommnds} from "./commands/mod.command";
import {UnmodCommnds} from "./commands/unmod.command";
import express from "express";
import {Stage} from "telegraf/scenes";
import {registerScene} from "./scenes/register.scene";
import {RegisterCommand} from "./commands/register.command";

class Bot {
    bot: Telegraf<IBotContext>;
    commands: Command[] = [];

    constructor(private readonly configService: IConfigServise) {
        this.bot = new Telegraf<IBotContext>(this.configService.get('TOKEN'));
        this.bot.use(
            new LocalSession({database: 'sessions.json'}).middleware()
        );
    }

    init() {
        const register = registerScene('register', () => {
            console.log('ok')
        });

        register.action('skip', (ctx) => {
            return ctx.wizard.steps[ctx.wizard.cursor+1](ctx);
        });

        register.action('seller', (ctx) => {
            ctx.wizard.state.user_data.role = 'seller';
            return ctx.wizard.steps[ctx.wizard.cursor](ctx);
        });

        register.action('blogger', (ctx) => {
            ctx.wizard.state.user_data.role = 'blogger';
            return ctx.wizard.steps[ctx.wizard.cursor](ctx);
        });

        register.action('agent', (ctx) => {
            ctx.wizard.state.user_data.role = 'agent';
            return ctx.wizard.steps[ctx.wizard.cursor](ctx);
        });

        register.action('Youtube', (ctx) => {
            ctx.wizard.state.selected_social = 'Youtube';
            ctx.wizard.cursor = 5;
            return ctx.wizard.steps[5](ctx);
        });

        register.action('VK', (ctx) => {
            ctx.wizard.state.selected_social = 'VK';
            ctx.wizard.cursor = 5;
            return ctx.wizard.steps[5](ctx);
        });

        register.action('Telegram', (ctx) => {
            ctx.wizard.state.selected_social = 'Telegram';
            ctx.wizard.cursor = 5;
            return ctx.wizard.steps[5](ctx);
        });

        register.action('Instagram', (ctx) => {
            ctx.wizard.state.selected_social = 'Instagram';
            ctx.wizard.cursor = 5;
            return ctx.wizard.steps[5](ctx);
        });

        register.action('OK', (ctx) => {
            ctx.wizard.state.selected_social = 'OK';
            ctx.wizard.cursor = 5;
            return ctx.wizard.steps[5](ctx);
        });

        register.action('Dzen', (ctx) => {
            ctx.wizard.state.selected_social = 'Dzen';
            ctx.wizard.cursor = 5;
            return ctx.wizard.steps[5](ctx);
        });

        register.action('Rutube', (ctx) => {
            ctx.wizard.state.selected_social = 'Rutube';
            ctx.wizard.cursor = 5;
            return ctx.wizard.steps[5](ctx);
        });

        register.action('Yappy', (ctx) => {
            ctx.wizard.state.selected_social = 'Yappy';
            ctx.wizard.cursor = 5;
            return ctx.wizard.steps[5](ctx);
        });

        register.action('Tiktok', (ctx) => {
            ctx.wizard.state.selected_social = 'Tiktok';
            ctx.wizard.cursor = 5;
            return ctx.wizard.steps[5](ctx);
        });

        register.action('add_social', (ctx) => {
            ctx.wizard.cursor = 4;
            return ctx.wizard.steps[4](ctx);
        });

        register.action('skip_social', (ctx) => {
            ctx.wizard.cursor = 7;
            return ctx.wizard.steps[7](ctx);
        });


        const stage = new Stage([
            register,
        ]);

        this.bot.use(stage.middleware());

        this.commands = [
            new StartCommnds(this.bot, adminService),
            new RegisterCommand(this.bot),
            new ListCommnds(this.bot, adminService),
            new ModCommnds(this.bot, adminService),
            new UnmodCommnds(this.bot, adminService),
        ];

        this.bot.action('enter_register', (ctx) => {
            ctx.scene.enter('register', {});
        });

        for (const command of this.commands) {
            command.handle();
        }

        this.bot.launch();
    }
}

const configService = ConfigService.getInstance();
const bot = new Bot(configService);
const adminService = AdminService.getInstance();

const expressApp = express();
const port = configService.get('EXPRESS_PORT');
expressApp.use(express.json());

expressApp.post('/reset-password', (request, response) => {
    if (!request.body.chatId) {
        response.statusCode = 400;
        response.json({"error": {chatId: "chatId is required"}});
    }

    if (!request.body.newPassword) {
        response.statusCode = 400;
        response.json({"newPassword": {chatId: "newPassword is required"}});
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
    if (!request.body.chatId) {
        response.statusCode = 400;
        response.json({"error": {chatId: "chatId is required"}});
        console.log({"error": {chatId: "chatId is required"}})
    }

    if (!request.body.text) {
        response.statusCode = 400;
        response.json({"text": {chatId: "text is required"}});
        console.log({"text": {chatId: "text is required"}})
    }

    let link = 'https://lk.adswap.ru/';

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
    if (!request.body.comment) {
        response.statusCode = 400;
        response.json({"comment": {chatId: "comment is required"}});
        console.log({"comment": {chatId: "comment is required"}})
    }

    if (!request.body.phone) {
        response.statusCode = 400;
        response.json({"phone": {chatId: "phone is required"}});
        console.log({"phone": {chatId: "phone is required"}})
    }

    if (!request.body.name) {
        response.statusCode = 400;
        response.json({"name": {chatId: "name is required"}});
        console.log({"name": {chatId: "name is required"}})
    }

    const adminService = AdminService.getInstance();
    const admins = adminService.getAdmins();
    let text = `Форма обратной связи\n\nИмя: ${request.body.name}\nТелефон: ${request.body.phone}\nСообщение: ${request.body.comment}`;

    admins.forEach(id => {
        bot.bot.telegram.sendMessage(id, text);
        response.json(id);
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

