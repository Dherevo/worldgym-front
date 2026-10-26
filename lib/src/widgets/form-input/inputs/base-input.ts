import { defineComponent } from 'vue';
import utils from '../../../modules/utils';

export default defineComponent({

    props: {
        modelValue: {},
        readonly: {
            default: false
        },
        disabled: {
            default: false
        },
        loading: {
            default: false
        },
        invalid: {
            default: false
        },
        stopTime: {
            type: Number,
            default: 300
        },
        type: {
            type: String
        }
    },

    data() {
        const data : {
            inputName: string,
            writeCount: number
        } = {
            inputName: '',
            writeCount: 0
        }
        return data;
    },

    mounted() {
        this.inputName = utils.randomString(5);
    },

    methods: {
        passEmit(event: string, arg?: any) {
            this.$emit(event, arg);
        },

        isInvalid() : boolean {
            if (this.invalid === undefined) return false;
            if (typeof(this.invalid) == 'boolean') return this.invalid;
            return (this.invalid as () => boolean)();
        },

        isReadonly() : boolean {
            if (this.readonly === undefined) return false;
            if (typeof(this.readonly) == 'boolean') return this.readonly;
            return (this.readonly as () => boolean)();
        },

        isDisabled() : boolean {
            if (this.disabled === undefined) return false;
            if (typeof(this.disabled) == 'boolean') return this.disabled;
            return (this.disabled as () => boolean)();
        },

        isLoading() : boolean {
            if (this.loading === undefined) return false;
            if (typeof(this.loading) == 'boolean') return this.loading;
            return (this.loading as () => boolean)();
        },
    }
});