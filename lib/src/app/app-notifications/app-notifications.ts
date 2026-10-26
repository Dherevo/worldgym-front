import { defineComponent } from 'vue';
import Message from 'primevue/message';
import utils from '../../modules/utils';
import IButton from '../../interfaces/IButton';

export type AppNotificationsInterface = {
    closeNotification: (notification: any) => void,
    closeLast: () => void,
    closeFirst: () => void
}

export type AppNotification = {
    id?: string,
    type?: 'success'|'info'|'warn'|'error',
    text?: string,
    component?: any,
    props?: any,
    closable?: boolean,
    time?: number,
    className?: string,
    buttons?: IButton[],
    onCompleteListener?: () => void,
    setType: (type: 'success'|'info'|'warn'|'error') => AppNotification,
    setText: (text: string) => AppNotification,
    class: (className: string) => AppNotification,
    notClosable: (closable: boolean) => AppNotification,
    setTime: (time: number) => AppNotification,
    setComponent: (component: any, props: any) => AppNotification,
    setButtons: (buttons: IButton[]) => AppNotification,
    onComplete: (listener: () => void) => AppNotification,
    show: () => void
}

export default defineComponent({

    components: { Message },

    data: function() {

        const data : {notifications: any[]} = {
            notifications: []
        };

        return data;
    },

    methods: {

        add(not: AppNotification) {
            if (!not.id) not.id = utils.randomString(5);
            this.notifications.push(not);

            if (not.time && not.time > 0) {
                setTimeout(() => {
                    this.closeNotification(not, true);
                }, not.time ?? 2000);
            }
        },

        classForElement(notification: AppNotification) {
            const cl : any = {}

            if (notification.type)
                cl[notification.type] = true;
            
            if (notification.component) {
                cl['custom'] = true;
            }

            if (notification.className) {
                cl[notification.className] = true;
            }

            return cl;
        },

        closeNotification(notification: AppNotification, timeout: boolean = false) {
            const index = this.notifications.indexOf(notification);
            if (index >= 0) {
                this.notifications.splice(index, 1);

                if (timeout && notification.onCompleteListener) {
                    notification.onCompleteListener();
                }
            }
        },

        closeLast() {
            this.notifications.splice( this.notifications.length - 1, 1);
        },

        closeFirst() {
            this.notifications.splice( 0, 1);
        },

        closeAll() {
            this.notifications = [];
        }
    }

})