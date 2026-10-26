import { defineComponent, markRaw } from 'vue';
import Dialog from 'primevue/dialog';
import IButton from '../../interfaces/IButton';
import utils from '../../modules/utils';

export type ModalType = {
    id: string,
    component: any,
    componentProps: any,
    html?: string,
    title?: string,
    background: boolean,
    draggable: boolean,
    maximizable: boolean,
    onMaximize: (open: boolean) => void,
    position: string,
    breakpoints: any,
    cancelable: boolean,
    closex: boolean,
    width?: string,
    class?: string,
    noPadding?: boolean,
    onClose?: () => void,
    visible: boolean,
    buttons: IButton[],
    close: () => Promise<any>
}

export type ModalOptions = {
    id?: string,
    component?: any, 
    props?: any,
    html?: string,
    title?: string,
    background?: boolean,
    draggable?: boolean,
    position?: 'center'|'left'|'top'|'bottom'|'right'|'topleft'|'topright'|'bottomleft'|'bottomright',
    maximizable?: boolean,
    onMaximize?: (open: boolean) => void,
    breakpoints?: any,
    cancelable?: boolean,
    closex?: boolean,
    width?: string,
    class?: string,
    noPadding?: boolean,
    onClose?: () => void,
    buttons?: IButton[]
}

export type AppModalInterface = {

    open: (options: ModalOptions) => void,

    current: ModalType|null,

    close: () => Promise<any>,

    setTitle: (title: string) => void,
    noCloseX: () => void,
    noBackground: () => void,
    setButtons: (buttons: IButton[]) => void,
    draggable: () => void,
    maximizable: () => void,
    cancelable: () => void,
    noPadding: () => void,
    onClose: (callback: () => void) => void,
    onMaximize: (callback: (open: boolean) => void) => void

}

export default defineComponent({

    components: { Dialog },

    data: function() {

        const data : {
            modals: ModalType[],
            current: ModalType|null,
            closing: boolean
        } = {
            modals: [],
            current: null,
            closing: false
        }

        return data;
    },

    methods: {

        classForModal(modal: any) {
            const cl : any = {'app-modal': true};
            if (modal.class) {
                cl[modal.class] = true;
            }
            if (modal.noPadding) {
                cl['no-padding'] = true;
            }
            if (modal.closex === false) {
                cl['no-closex'] = true;
            }

            if (!modal.title && !modal.closex && !modal.maximizable) {
                cl['no-header'] = true;
            }

            return cl;
        },

        open(options: ModalOptions) {

            if (this.closing) {
                setTimeout(() => {
                    this.open(options);
                }, 150);
                return;
            }

            const modal : ModalType = {
                id: options.id ? options.id : utils.randomString(5),
                component: options.component ? markRaw(options.component) : undefined,
                componentProps: options.props ? options.props : {},
                cancelable: options.cancelable === true ? true : false,
                html: options.html,
                title: options.title,
                background: options.background === false ? false : true,
                draggable: options.draggable ? true : false,
                position: options.position ? options.position : 'center',
                maximizable: options.maximizable ? true : false,
                onMaximize: options.onMaximize ? options.onMaximize : () => {},
                breakpoints: options.breakpoints,
                closex: options.closex === false ? false: true,
                width: options.width,
                class: options.class,
                noPadding: options.noPadding ? true : false,
                onClose: options.onClose,
                visible: true,
                buttons: options.buttons ? options.buttons : [],
                close: () => this.close(modal)
            };

            this.modals.push(modal);
            this.current = modal;

            if (modal.background && modal.cancelable) {
                setTimeout(() => {
                    const masks = document.getElementsByClassName('p-dialog-mask');
                    if (masks.length == 0) return;

                    const last = masks[masks.length - 1];
                    const dialog = last.querySelector('.p-dialog');
                    if (!dialog) return;

                    dialog.addEventListener('click', () => {
                        this.dialogClicked = true;
                        setTimeout(() => {
                            this.dialogClicked = false;
                        }, 2)
                    })

                    last.addEventListener('click', () => {
                        if (!this.dialogClicked) {
                            this.close(modal);
                        }
                    })
                }, 10)
            }

        },

        close(modal?: ModalType) : Promise<any> {
            return new Promise(resolve => {

                this.closing = true;

                if (this.modals.length == 0) {
                    resolve(true);
                    return;
                }
    
                const last = modal ? modal : this.modals[this.modals.length - 1];
                last.visible = false;

                setTimeout(() => {
                    const index = this.modals.indexOf(last);
                    if (index > -1) {
                        this.modals.splice(index, 1);
                    }

                    this.current = this.modals.length > 0 ? 
                        this.modals[this.modals.length - 1] : null;

                    if (last.onClose) {
                        last.onClose();
                    }
                    last.visible = false;
                    resolve(true);
                    this.closing = false;
                }, 300);
            });

        },

        clickOnButton(modal: ModalType, btn: IButton) {
            const ret : any = btn.onClick!();

            if (ret !== false) {
                this.close(modal);
            }
        },

        /////

        setTitle(title: string) {
            if (!this.current) return;
            this.current.title = title;
        },

        noCloseX() {
            if (!this.current) return;
            this.current.closex = false;
        },

        noBackground() {
            if (!this.current) return;
            this.current.background = false;
        },

        draggable() {
            if (!this.current) return;
            this.current.draggable = true;
        },

        maximizable() {
            if (!this.current) return;
            this.current.maximizable = true;
        },

        cancelable() {
            if (!this.current) return;
            this.current.cancelable = true;
        },

        noPadding() {
            if (!this.current) return;
            this.current.noPadding = true;
        },

        setButtons(buttons: IButton[]) {
            if (!this.current) return;
            this.current.buttons = buttons;
        },

        onClose(callback: () => void) {
            if (!this.current) return;
            this.current.onClose = callback;
        },

        onMaximize(callback: (open: boolean) => void) {
            if (!this.current) return;
            this.current.onMaximize = callback;
        }

    }

})