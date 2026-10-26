import { defineComponent } from 'vue';
import Checkbox from 'primevue/checkbox';
import BooleanIcon from '../../../boolean-icon/boolean-icon.vue';
import BaseInput from '../base-input';

export default defineComponent({

    components: {
        Checkbox,
        BooleanIcon
    },

    mixins: [BaseInput],

    emits: [
        'update:modelValue',
        'change'
    ],

    methods: {
        updateValue(value: boolean) {
            setTimeout(() => {
                this.$emit('update:modelValue', value);
            }, 5)
        },
        
        bindProps() {
            const obj : any = {
                inputId: this.inputName
            }
             
            return obj;
        },
    }
});