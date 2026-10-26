import { ComponentOptions } from 'vue';
import translate from '../modules/translator';
import Utils, { UtilsType } from '../modules/utils';
import StorageClass, { Storage } from '../modules/storage';
import Config from '../modules/config';
import utils from '../modules/utils';
import StoreClass, { Store } from '../modules/store';
import PackageState from '../modules/PackageState';
import Validator from '../modules/validator';

declare module '@vue/runtime-core' {
    interface ComponentCustomProperties {
        $config: any,
        $store: StoreClass,
        $storage: StorageClass,
        $utils: UtilsType,
        $t: (key: string, params?: any) => any,
        hasEvent: (name: string) => boolean,
        to: (page: string) => void,
        back: () => void,
        ref: (name: string) => any,
        closeModal: () => void,
        closeDrawer: () => void,
        forceUpdate: () => void
    }
}

export default (App: any) => {

    const cmp : ComponentOptions = {
        data() {
            return {
                _updateCheck: 1
            }
        },
    
        computed: {
            appVersion() {
                return PackageState.get('version');
            },
            $config() {
                return Config.values();
            },
            $store() : StoreClass {
                return Store;
            },
            $utils() : UtilsType {
                return Utils;
            },
            $storage() : StorageClass {
                return Storage;
            },
            $lang() : any {
                return translate;
            }
        },
    
        methods: {
    
            forceUpdate() {
                this._updateCheck += 1;
            },
    
            $t(key: string, params?: any) : string {
                return translate.get(key, params);
            },
            hasEvent(name: string) : boolean {
                return this.$attrs && !(!this.$attrs['on' + utils.capitalize(name)]);
            },
    
            to(page: string) {
                this.$router.push(page);
            },
    
            back() {
                this.$router.back();
            },
    
            ref(name: string) : any {
                return this.$refs[name] as any;
            },
    
            closeModal() {
                return App.modal.close();
            },
    
            closeDrawer() {
                return App.drawer.close();
            },
    
            hasSlot(name: string) : boolean {
                return !!this.$slots[name];
            },

            validatorFor(value: any) : Validator {
                return Validator.for(value);
            },

            param(name: string) : string {
                return (this as any).$route.params[name] ?? '';
            }
        }
    }
    return cmp;
}