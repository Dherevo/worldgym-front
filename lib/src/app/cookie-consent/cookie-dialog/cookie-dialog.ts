import { defineComponent, PropType } from 'vue';
import App from '../../../modules/app';
import translate from '../../../modules/translator';
import ToggleSwitch from 'primevue/toggleswitch';

export default defineComponent({

    components: { ToggleSwitch },

    props: {
        types: {
            type: Object as PropType<{
                id: string,
                accepted: boolean
            }[]>,
            required: true
        },
        onClose: {
            type: Function,
            required: true
        }
    },

    methods: {
        $t(key: string) {
            return translate.get(key);
        },
        closeModal() {
            App.modal.close();
        },

        collect(accept: boolean, all: boolean = false) {
            const cookies : any = {
                required: accept
            }

            for(const t of this.types) {
                cookies[t.id] = t.accepted || all;
            }

            return cookies;
        },

        reject() {
            this.onClose(this.collect(false));
            this.closeModal();
        },

        all() {
            this.onClose(this.collect(true, true));
            this.closeModal();
        },

        accept() {
            this.onClose(this.collect(true));
            this.closeModal();
        }
    }

})