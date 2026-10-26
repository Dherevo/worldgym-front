import { createRouter, createWebHistory } from 'vue-router';
import PrimeVue, { defaultOptions} from 'primevue/config';
import Ripple from 'primevue/ripple';
import { AppModalInterface, ModalOptions, ModalType } from '../app/app-modal/app-modal';
import { AppNotification, AppNotificationsInterface } from '../app/app-notifications/app-notifications';
import { DrawerInterface, DrawerOptions } from '../app/drawer/drawer';
import { CookieConsentInterface, CookieType } from '../app/cookie-consent/cookie-consent';
import translate from './translator';
import IAppConfig from '../interfaces/IAppConfig';
import Config from './config';
import Container from '../widgets/grid/cntainer.vue';
import Row from '../widgets/grid/row.vue';
import Col from '../widgets/grid/cul.vue';
import SvgIcon from '../widgets/svg-icon/svg-icon.vue';
import Btn from '../widgets/btn/btn.vue';
import CloseX from '../widgets/closex/closex.vue';
import Loader from '../widgets/loader/loader.vue';
import http from './http/http';
import IButton from '../interfaces/IButton';
import baseComponent from '../app/base-component';
import { markRaw } from 'vue';
import IRoutes from '../interfaces/IRoutes';
import PackageState from './PackageState';
import { Storage } from './storage';
import ScreenLoader from '../modals/screen-loader/screen-loader.vue';
import { definePreset } from '@primevue/themes';
import Aura from '@primevue/themes/aura';
import Link from '../widgets/link/link.vue';
import DOMPurify from 'dompurify';

const SafeHtml = {
    mounted(el: HTMLElement, binding: any) {
      el.innerHTML = DOMPurify.sanitize(binding.value);
    },
    updated(el: HTMLElement, binding: any) {
      el.innerHTML = DOMPurify.sanitize(binding.value);
    }
};

class AppClass {

    getVersion() {
        return PackageState.get('version');
    }

    init(version: string, app: any, config: IAppConfig, routes: IRoutes, locales: any) {

        PackageState.set('version', version);

        Config.init(config, routes.layouts);
        http.token.loadFromStorage();
        translate.initialize(locales);  // Languages

        const router = createRouter({
            history: createWebHistory(),
            routes: routes.routes as any,
        });
        app.use(router);

        this.initPrime(app, locales);
        app.mixin(baseComponent(this));

        // Register global components
        app.component('Container', Container);
        app.component('Row', Row);
        app.component('Col', Col);
        app.component('SvgIcon', SvgIcon);
        app.component('Btn', Btn);
        app.component('CloseX', CloseX);
        app.component('Loader', Loader);
        app.component('Link', Link);

        // Directives
        app.directive('ripple', Ripple);
        app.directive('safe-html', SafeHtml);
        app.directive('bgimage',{

            mounted(el: HTMLElement, binding: any) {
                el.style.backgroundPosition = 'center';
                el.style.backgroundSize = 'cover';
                el.style.backgroundRepeat = 'no-repeat';
                el.style.backgroundColor = 'gray';
                el.style.backgroundImage = `url('${binding.value}')`;
            },
            updated(el: HTMLElement, binding: any) {
                el.style.backgroundPosition = 'center';
                el.style.backgroundSize = 'cover';
                el.style.backgroundRepeat = 'no-repeat';
                el.style.backgroundColor = 'gray';
                el.style.backgroundImage = `url('${binding.value}')`;
            },
        });

        return app;
    }

    initPrime(app: any, locales: any = {}) {

        const rootElement = document.documentElement;
        const computedStyles = getComputedStyle(rootElement);
        const colorScheme = computedStyles.getPropertyValue('color-scheme');

        app.use(PrimeVue, { 
            ripple: true,
            theme: {
                preset: definePreset(Aura, {}),
                options: {
                    darkModeSelector: colorScheme
                }
            },
            locale: {
                ...defaultOptions.locale,
                ...(locales.prime ?? {}),
                firstDayOfWeek: 1
            }
         });

        if (!document) return;
        const root = document.querySelector(':root');
        if (!root) return;

        let c = getComputedStyle(root).getPropertyValue('--primary-color');
        if (c) {
            (root as any).style.setProperty('--p-primary-color', c);
            (root as any).style.setProperty('--p-primary-hover-color', c);
        }

        c = getComputedStyle(root).getPropertyValue('--highlight');
        if (c) {
            (root as any).style.setProperty('--p-highlight-background', c);
            (root as any).style.setProperty('--p-select-option-selected-focus-background', c);
        }

        c = getComputedStyle(root).getPropertyValue('--highlight-text');
        if (c) {
            (root as any).style.setProperty('--p-highlight-color', c);
            (root as any).style.setProperty('--p-select-option-selected-focus-color', c);
        }

        c = getComputedStyle(root).getPropertyValue('--border-radius');
        if (c) {
            (root as any).style.setProperty('--p-border-radius', c);
        }
    }

    darkMode(active: boolean) {
        document.documentElement.classList.toggle('dark-mode', active);
    }

    drawer : DrawerInterface = {

        setTitle(title: string) {
            const ref = PackageState.get('globalWidgets');
            if (!ref || !ref.drawer) return this;

            ref.drawer.title = title;
            return this;
        },

        setButtons(buttons: IButton[]) {
            const ref = PackageState.get('globalWidgets');
            if (!ref || !ref.drawer) return this;

            ref.drawer.buttons = buttons
            return this;
        },

        onClose(func: (param?:any) => any) {
            const ref = PackageState.get('globalWidgets');
            if (!ref || !ref.drawer) return this;

            ref.drawer.onClose = func;
            return this;
        },

        open(options: DrawerOptions) {
            const ref = PackageState.get('globalWidgets');
            if (!ref || !ref.drawer) return this;

            ref.drawer.open(options);
            return this;
        },

        close() {
            const ref = PackageState.get('globalWidgets');
            if (!ref || !ref.drawer) {
                return new Promise(() => {});
            }

            return ref.drawer.close();
        }

    };

    notification(text: string = '') : AppNotification {

        const builder : AppNotification = {
            type: 'success',
            text: text,
            component: undefined,
            props: {},
            time: 2000,
            closable: true,
            className: '',
            onCompleteListener: undefined,
            setType(type: 'success'|'info'|'warn'|'error') {
                this.type = type;
                return this;
            },
            notClosable() {
                this.closable = false;
                return this;
            },
            setTime(time: number) {
                this.time = time;
                return this;
            },
            setText(text: string) {
                this.text = text;
                return this;
            },
            setButtons(buttons: IButton[]) {
                this.buttons = buttons;
                if (this.time === 2000) {
                    this.time = 3000;
                }
                return this;
            },
            setComponent(component: any, props: any = {}) {
                this.component = markRaw(component);
                this.props = props;
                return this;
            },
            class(className: string) {
                this.className = className;
                return this;
            },
            onComplete(listener: () => void) {
                this.onCompleteListener = listener;
                return this;
            },
            show() : void {
                const ref = PackageState.get('globalWidgets');
                if (!ref || !ref.notifications) return;

                ref.notifications.add(this);
            }
        }

        return builder;
    }

    notifications : AppNotificationsInterface = {

        closeNotification(notification: any) {
            const ref = PackageState.get('globalWidgets');
            if (!ref || !ref.notifications) return;

            ref.notifications.closeNotification(notification);
        },

        closeLast() {
            const ref = PackageState.get('globalWidgets');
            if (!ref || !ref.notifications) return;

            ref.notifications.closeLast();
        },
        closeFirst() {
            const ref = PackageState.get('globalWidgets');
            if (!ref || !ref.notifications) return;

            ref.notifications.closeFirst();
        }

    }

    modal : AppModalInterface = {

        open(options: ModalOptions) {
            const ref = PackageState.get('globalWidgets');
            if (!ref || !ref.modal) return;

            ref.modal.open(options);
        },

        get current() : ModalType|null {
            const ref = PackageState.get('globalWidgets');
            if (!ref || !ref.modal) return null;

            if (ref.modal.modals.length == 0) return null;
            return ref.modal.modals[ref.modal.modals.length - 1];
        },
    
        close() {
            const ref = PackageState.get('globalWidgets');
            if (!ref || !ref.modal) {
                return new Promise(() => {});
            }

            return ref.modal.close();
        },

        setTitle(title: string) {
            const ref = PackageState.get('globalWidgets');
            if (!ref || !ref.modal) return;

            ref.modal.setTitle(title);
        },

        noCloseX() {
            const ref = PackageState.get('globalWidgets');
            if (!ref || !ref.modal) return;

            ref.modal.noCloseX();
        },

        noBackground() {
            const ref = PackageState.get('globalWidgets');
            if (!ref || !ref.modal) return;

            ref.modal.noBackground();
        },

        draggable() {
            const ref = PackageState.get('globalWidgets');
            if (!ref || !ref.modal) return;

            ref.modal.draggable();
        },

        maximizable() {
            const ref = PackageState.get('globalWidgets');
            if (!ref || !ref.modal) return;

            ref.modal.maximizable();
        },

        cancelable() {
            const ref = PackageState.get('globalWidgets');
            if (!ref || !ref.modal) return;

            ref.modal.cancelable();
        },

        noPadding() {
            const ref = PackageState.get('globalWidgets');
            if (!ref || !ref.modal) return;

            ref.modal.noPadding();
        },

        setButtons(buttons: IButton[]) {
            const ref = PackageState.get('globalWidgets');
            if (!ref || !ref.modal) return;

            ref.modal.setButtons(buttons);
        },

        onClose(callback: () => void) {
            const ref = PackageState.get('globalWidgets');
            if (!ref || !ref.modal) return;

            ref.modal.onClose(callback);
        },

        onMaximize(callback: (open: boolean) => void) {
            const ref = PackageState.get('globalWidgets');
            if (!ref || !ref.modal) return;

            ref.modal.onMaximize(callback);
        }

    }

    alert(text: string, buttons?: IButton[]) {

        return new Promise(resolve => {

            this.modal.open({
                html: text,
                class: 'alert-modal',
                onClose: () => resolve(true),
                buttons
            })

        })

    }

    confirm(content: any, options?: {
        title?: string,
        class?: string,
        cancelButton?: IButton,
        confirmButton?: IButton
    }) : Promise<any> {

        return new Promise(resolve => {

            const cancelButtonClass: any = {
                'cancel-btn': true
            }
            if (options && options.cancelButton && options.cancelButton.class) {
                cancelButtonClass[options.cancelButton.class] = true;
            }

            const acceptButtonClass: any = {
                'confirm-btn': true
            }
            if (options && options.confirmButton && options.confirmButton.class) {
                acceptButtonClass[options.confirmButton.class] = true;
            }

            this.modal.open({
                title: options && options.title ? options.title : undefined,
                html: content,
                closex: false,
                class: 'confirm-modal'  + (options && options.class ? ' ' + options.class : ''),
                buttons: [
                    {
                        class: cancelButtonClass,
                        style: options && options.cancelButton && options.cancelButton.style ? options.cancelButton.style : {},
                        icon: options && options.cancelButton && options.cancelButton.icon ? options.cancelButton.icon : 'prime/times',
                        content: options && options.cancelButton && options.cancelButton.content ? options.cancelButton.content : translate.get('generic.cancel'),
                        onClick: () => {
                            this.modal.close();
                            resolve(false);
                        }
                    },
                    {
                        class: acceptButtonClass,
                        style: options && options.confirmButton && options.confirmButton.style ? options.confirmButton.style : {},
                        icon: options && options.confirmButton && options.confirmButton.icon ? options.confirmButton.icon : 'prime/check',
                        content: options && options.confirmButton && options.confirmButton.content ? options.confirmButton.content : translate.get('generic.accept'),
                        onClick: () => {
                            this.modal.close();
                            resolve(true);
                        } 
                    }
                ]
            })

        });

    }

    confirmDelete() {

        return this.confirm(`<div class="flex-row gap10">
            <svg xmlns="http://www.w3.org/2000/svg" class="icon sprite-icons" style="width:25px;height:25px">
                <use href="/svg-icons/prime.svg#exclamation-triangle" 
                xlink:href="/svg-icons/prime.svg#exclamation-triangle"></use>
            </svg>
            <div>${translate.get('confirm.delete')}</div>
        </div>`, {
            confirmButton: {
                content: translate.get('generic.delete'),
                class: 'delete-btn'
            }
        })
    }

    loaderComponent = ScreenLoader;
    loading() {
        this.modal.open({
            component: this.loaderComponent,
            class: 'fullscreen-loader-modal',
            closex: false,
            props: {
                color: 'white'
            }
        });
    }

    stopLoading() {
        this.modal.close();
    }
    cookieConsent : CookieConsentInterface = {

        enable() {
            const ref = PackageState.get('globalWidgets');

            if (!ref || !ref.cookieConsent) {
                PackageState.set('cookieConsentEnabled', true)
            } else {
                ref.cookieConsent.enable();
            }
        },

        reset() {
            const ref = PackageState.get('globalWidgets');

            if (!ref || !ref.cookieConsent) {
                Storage.remove('cookie-consent');
                PackageState.set('cookieConsentEnabled', true)
            } else {
                ref.cookieConsent.reset();
            }
        },

        disable() {
            const ref = PackageState.get('globalWidgets');

            if (!ref || !ref.cookieConsent) {
                PackageState.set('cookieConsentEnabled', false)
            } else {
                ref.cookieConsent.disable();
            }
        },

        addType(type: CookieType) {
            const ref = PackageState.get('globalWidgets');

            if (!ref || !ref.cookieConsent) {
                const list = PackageState.get('cookiePendingTypes');
                if (list) {
                    list.push(type);
                } else {
                    PackageState.set('cookiePendingTypes', [type])
                }
            } else {
                ref.cookieConsent.addType(type);
            }
        },

        getPreferences() {
            const prefs = Storage.get('cookie-consent');
            if (!prefs) {
                return {accepted: false}
            }

            prefs['accepted'] = true;
            return prefs;
        }

    }

}

const App = new AppClass();
export default App;