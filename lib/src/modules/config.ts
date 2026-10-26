import IAppConfig from "../interfaces/IAppConfig";
import ILanguageConfig from "../interfaces/ILanguageConfig";
import PackageState from "./PackageState";
import utils from "./utils";

export default class Config {

    public static values() : any { 
        const config = PackageState.get('config');
        return config ?? {}
    }

    public static layouts() : any { 
        const layouts = PackageState.get('layouts');
        return layouts ?? {}
    }

    public static languageConfig() : ILanguageConfig {

        const config = PackageState.get('config');
        if (config && config.language) {
            return config.language;
        }

        return {default: 'en'}
    }

    static init(config: IAppConfig, layouts?: any) {
        PackageState.set('config', config);
        if (layouts) {
            PackageState.set('layouts', layouts);
        }
    }

    public static get(key: string, defaultValue: any = undefined) : any {
        return utils.dotNotation(Config.values(), key, defaultValue);
    }

    public static merge(config: any) {
        let current = Config.values();
        current = utils.merge(current, config);
        PackageState.set('config', current);
    }
}