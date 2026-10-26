import Utils from './utils';
import { locales as def } from './locales/locales';
import Config from './config';
import PackageState from './PackageState';
import Moment from 'moment-timezone';

class Translator {

    get currentLanguage() {
        const obj = PackageState.get('translations');
        return obj['currentLanguage'];
    }

    initialize(config: any) {

        const locales = config.locales;

        let obj = PackageState.get('translations');
        if (obj) return;

        obj = {
            cache: {}
        }

        const defaultLanguage = config.defaultLanguage ?? 'en';

        Object.keys(locales)
        .forEach((lang: string) => {
            if (!def[lang]) return;
            locales[lang] = Utils.merge(def[lang], locales[lang]);
        });

        if (config.moment) {
            const m : any = {}
            Object.keys(config.moment)
            .forEach((loc: string) => {
                if (!config.moment[loc]['_config']) {
                    return;
                }
                m[loc] = config.moment[loc]['_config'];
            })
            locales['moment'] = m;
        }

        obj['locales'] = locales;

        const userLang = navigator.language.substr(0, 2);
        obj['currentLanguage'] = (Object.keys(locales)).includes(userLang) ?
            userLang : defaultLanguage;

        obj['translations'] = locales[obj['currentLanguage']];

        PackageState.set('translations', obj);

        this.updateMomentLanguage();
    }

    merge(translations: any) {
        const obj = PackageState.get('translations');
        if (!obj) return;

        const l = obj.locales[obj.currentLanguage];
        if (!l) return;

        Object.keys(translations)
        .forEach((k: string) => {
            l[k] = translations[k];
        });
        obj.cache = {};
    }

    get supportedLanguages() : string[] {
        const obj = PackageState.get('translations');
        if (!obj) return [Config.get('language.default')];
        return Object.keys(obj.translations);
    }

    updateMomentLanguage() {
        const obj : any = PackageState.get('translations');

        if (!obj.moment) return;
        if (!obj.moment[this.currentLanguage]) return;
        Moment.updateLocale(this.currentLanguage, obj.moment[this.currentLanguage]);
        Moment.locale(this.currentLanguage);
    }

    changeLanguage(language: string) {
        const obj = PackageState.get('translations');
        if (!obj) return;

        if (!(Object.keys(obj.locales)).includes(language)) return;
        obj.cache = {};
        obj.currentLanguage = language;
        obj.translations = obj.locales[obj.currentLanguage];
        PackageState.set('translations', obj);
        this.updateMomentLanguage();
    }

    get(key: string, parameters?: any) : string {
        const obj = PackageState.get('translations');
        if (!obj) return key;

        let trans = 
        obj.cache[key] ? obj.cache[key] :
        Utils.dotNotation(obj.translations, key);

        obj.cache[key] = trans;

        if (parameters) {
            Object.keys(parameters).forEach((k: string) => {
                trans = trans.replace('{{' + k + '}}', parameters[k]);
            });
        }

        return trans;
    }

}
const translate = new Translator();
export default translate;