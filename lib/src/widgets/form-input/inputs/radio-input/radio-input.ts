import { defineComponent } from 'vue';
import BooleanIcon from '../../../boolean-icon/boolean-icon.vue';
import BaseInput from '../base-input';
import RadioButton from 'primevue/radiobutton';

export default defineComponent({

    components: {
        RadioButton,
        BooleanIcon
    },

    mixins: [BaseInput],

    props: {
        modelValue: {
            type: String,
            default: ''
        },
        group: {
            type: String,
            default: ''
        },
        value: {
            type: String,
            default: ''
        }
    },

    emits: [
        'update:modelValue',
        'change'
    ],

    methods: {
        updateValue(event: any) {
            const value = event.target.value;
            this.$emit('update:modelValue', value);
        },
        
        bindProps() {
            const obj : any = {
                inputId: this.inputName
            }
             
            return obj;
        },
    }
});