import { defineComponent } from 'vue';
import ToggleSwitch from 'primevue/toggleswitch';
import BooleanIcon from '../../../boolean-icon/boolean-icon.vue';
import baseInput from '../base-input';

export default defineComponent({

    components: {
        ToggleSwitch,
        BooleanIcon
    },

    mixins: [baseInput],

    props: {
        modelValue: {
            type: Boolean
        },
        readonly: {
            type: Boolean
        },
        disabled: {
            type: Boolean
        },
        props: {
            type: Object
        },
        classes: {
            type: Object
        },
        name: {
            type: String
        }
    },

    emits: ['update:modelValue', 'change'],

    data() {
        const data : { } = { }
        return data;
    },

    methods: {
        bindProps() {
            const obj : any = {}
             
            return obj;
        },

        updateValue(value: boolean) {
            this.$emit('update:modelValue', value);
        },
    }
});