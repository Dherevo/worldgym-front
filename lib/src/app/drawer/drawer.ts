import { defineComponent } from 'vue';
import Drawer from 'primevue/drawer';
import IButton from '../../interfaces/IButton';

export type DrawerOptions = {
    component: any,
    props?: any,
    position?: 'left'|'top'|'right'|'bottom'|'full',
    cancelable?: boolean,
    title?: string,
    buttons?: IButton[],
    closex?: boolean,
    onClose?: (param?:any) => any
};

export type DrawerInterface = {
    setTitle: (title: string) => void,
    setButtons : (buttons: IButton[]) => void,
    onClose: (func: (param?:any) => any) => void,

    open: (options: DrawerOptions) => void,

    close: () => Promise<any>
}

export default defineComponent({

    components: {Drawer},

    data: function() {
        const data : {
            visible: boolean,
            position: 'left'|'top'|'right'|'bottom'|'full',
            cancelable: boolean,
            component: any,
            componentProps: any,
            title: string,
            buttons: IButton[],
            closex: boolean,
            onClose: (param?:any) => any
        } = {
            visible: false,
            position: 'right',
            cancelable: false,
            component: null,
            componentProps: {},
            title: '',
            buttons: [],
            closex: true,
            onClose: () => {}
        }

        return data;
    },

    methods: {

        open(options: DrawerOptions) {

            this.component = options.component;
            this.componentProps = options.props ? options.props : {};
            this.position = options.position ? options.position : 'right';
            this.title = options.title ? options.title : '';
            this.closex = options.closex === false ? false : true;
            this.cancelable = options.cancelable ? true : false;

            this.buttons = options.buttons ? options.buttons : [];
            this.onClose = options.onClose ? options.onClose : () => Promise.resolve(true);

            setTimeout(() => {
                this.visible = true;
            }, 10);
        },

        close(param?: any) {

            return new Promise(resolve => {
                this.visible = false;
                setTimeout(() => {
                    this.component = null;
                    this.componentProps = {};
                    this.onClose(param);
                    resolve(true);
                }, 500);
            });
        }
    }

})