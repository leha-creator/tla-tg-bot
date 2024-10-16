import {ConfigService} from "../config/configService";

export const getDomain = () => {
    const configService = ConfigService.getInstance();
    if (configService.get('ENVIRONMENT') == 'production') {
        return configService.get('BASE_DOMAIN');
    }

    return configService.get('DEV_DOMAIN');
};
