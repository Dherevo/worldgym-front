import { defineComponent } from 'vue';
import Password from 'primevue/password';
import baseInput from '../base-input';

export default defineComponent({

    components: { Password },

    mixins: [baseInput],

    props: {
        instructions: {
            type: String
        },
        name: {
            type: String
        }
    },

    emits: [
        'blur',
        'focus',
        'keyup',
        'keydown',
        'update:modelValue',
        'change'
    ],

    data() {
        const data : {
            showPassword: boolean
        } = {
            showPassword: false
        }
        return data;
    },

    methods: {
        bindProps() {
            const obj : any = {
                inputId: this.inputName
            }

            if (obj['feedback'] === undefined) {
                obj['feedback'] = this.instructions ? true : false;
            }
            if (obj['toggleMask'] === undefined) {
                obj['toggleMask'] = true;
            }
             
            return obj;
        },

        focus() {
            if (!this.$refs.input) return;
            this.$refs.input.$el.querySelector('input').focus();
        },

        blur() {
            if (!this.$refs.input) return;
            (this.$refs.input as any).blur();
        },
        
        updateValue(value: any) {
            this.$emit('update:modelValue', value);
        }
    }
});