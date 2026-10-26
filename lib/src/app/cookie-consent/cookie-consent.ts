import { defineComponent } from 'vue';
import translate from '../../modules/translator';
import { Storage } from '../../modules/storage';
import App from '../../modules/app';
import CookieDialog from './cookie-dialog/cookie-dialog.vue';
import PackageState from '../../modules/PackageState';

export type CookieConsentInterface = {
    addType: (type: CookieType) => void,
    getPreferences: () => any,
    enable: () => void,
    reset: () => void,
    disable: () => void
}

export type CookieType = {
    id: string,
    name: string,
    description: string,
    accepted?: boolean,
    required?: boolean
}

export default defineComponent({

    data() {
        const data : {
            enabled: boolean,
            cookiesAnswered: boolean,
            types: CookieType[]
        } = {
            enabled: false,
            cookiesAnswered: false,
            types: []
        };

        return data;
    },

    created() {
        this.cookiesAnswered = !(!Storage.get('cookie-consent'));

        const ref = PackageState.get('cookiePendingTypes');
        const enabled = PackageState.get('cookieConsentEnabled');

        if (enabled) {
            this.enabled = true;
            PackageState.delete('cookieConsentEnabled');
        }

        if (ref) {
            for(const type of ref) {
                this.addType(type);
            }
            PackageState.delete('cookiePendingTypes');
        }
    },

    methods: {
        $t(key: string) {
            return translate.get(key);
        },

        enable() {
            this.enabled = true;
            setTimeout(() => {
                this.$forceUpdate();
            }, 5);
        },

        disable() {
            this.enabled = false;
            setTimeout(() => {
                this.$forceUpdate();
            }, 5);
        },

        reset() {
            Storage.remove('cookie-consent');
            this.enabled = true;
            this.$forceUpdate();
        },

        save(cookies: any) {
            this.cookiesAnswered = true;
            Storage.set('cookie-consent', cookies);
        },

        collect(accept: boolean) {
            const cookies : any = {
                required: accept
            }

            for(const t of this.types) {
                cookies[t.id] = accept;
            }

            return cookies;
        },

        accept() {
            this.save(this.collect(true));
        },

        reject() {
            this.save(this.collect(false));
        },

        addType(type: CookieType) {
            const t : any = type;
            t['accepted'] = t.accepted ? true : false;

            this.types.push(t);
        },

        configure() {
            App.modal.open({
                component: CookieDialog,
                class: 'cookie-configuration',
                props: {
                    types: this.types,
                    onClose: (cookies: any) => {
                        this.save(cookies);
                    }
                }
            })
        }
    }

})