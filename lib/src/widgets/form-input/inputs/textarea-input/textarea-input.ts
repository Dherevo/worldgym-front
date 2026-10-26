import { defineComponent } from 'vue';
import Textarea from 'primevue/textarea';
import baseInput from '../base-input';

export default defineComponent({

    components: { Textarea },

    mixins: [baseInput],

    props: {
        modelValue: {
            type: String
        },
        readonly: {
            type: Boolean
        },
        disabled: {
            type: Boolean
        },
        autoResize: {
            type: Boolean,
            default: true
        },
        placeholder: {
            type: String
        },
        max: {
            type: Number
        },
        name: {
            type: String
        }
    },

    emits: [
        'stop',
        'change',
        'update:modelValue',
        'blur',
        'focus',
        'keyup',
        'keydown'
    ],

    methods: {
        passEmit(event: string, arg?: any) {
            this.$emit(event as any, arg);
        },

        bindProps() {
            let obj : any = {
                autoResize: this.autoResize
            }
    
            obj = {
                ...obj,
                inputId: this.inputName
            }

            return obj;
        },

        focus() {
            if (!this.$refs.input) return;
            (this.$refs.input as any).focus();
        },

        blur() {
            if (!this.$refs.input) return;
            (this.$refs.input as any).blur();
        },
        
        updateValue(value: any) {
            this.$emit('update:modelValue', value);
            this.stopEvent(value);
        },

        stopEvent(value?: any) {
            this.writeCount += 1;
            const currentWriteCount = this.writeCount;

            setTimeout(() => {
                if (currentWriteCount == this.writeCount) {
                    this.$emit('stop', value);
                }
            }, this.stopTime);
        },
    }
});