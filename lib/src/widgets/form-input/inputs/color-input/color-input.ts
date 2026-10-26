import { defineComponent } from 'vue';
import ColorPicker from 'primevue/colorpicker';
import baseInput from '../base-input';

export default defineComponent({

    components: { ColorPicker },

    mixins: [baseInput],

    props: {
        name: {
            type: String
        }
    },

    emits: [
        'update:modelValue',
        'change'
    ],

    methods: {
        updateValue(value: any) {
            this.$emit('update:modelValue', value);
        }
    }
});