import { defineComponent } from 'vue';
import intlTelInput from 'intl-tel-input';
import 'intl-tel-input/build/css/intlTelInput.css';
import baseInput from '../base-input';

export default defineComponent({

    mixins: [baseInput],

    props: {
        number: {
            type: String
        },
        prefix: {
            type: String
        },
        phoneOptions: {
            type: Object
        }
    },

    emits: [
        'keyup',
        'change',
        'update:modelValue',
        'update:prefix',
        'update:country'
    ],

    data() {
        const data : {
            iti: any,
            phoneNumber: string
        } = {
            iti: null,
            phoneNumber: ''
        }
        return data;
    },

    mounted() {
        this.setup();

        if (this.number) {
            this.phoneNumber = (this.prefix ?? '') + (this.number ?? '');
        }
    },

    methods: {
        setup() {
            const container = this.$refs.container as any;
            if (!container) return;

            const already = container.querySelector('.iti');
            if (already) {
                already.remove();
            }
            
            const ref = this.$refs.input as any;
            if (!ref) return;
            ref.value = this.modelValue;
            const country = navigator.language.split('-')[1]?.toLowerCase() || "us";

            const ops = this.phoneOptions ?? {};
            ops['initialCountry'] = country;

            this.iti = intlTelInput(ref, ops);

            ref.addEventListener("keyup", () => {
                const data = this.getPhoneData();
                if (!data) return;
                this.updateValue(data);
                this.passEmit('keyup', data);
            });

            ref.addEventListener("countrychange", () => {
                const data = this.getPhoneData();
                if (!data) return;
                this.updateValue(data);
            });

            if(this.phoneNumber){
                const data = this.getPhoneData();
                this.phoneNumber = this.phoneNumber.replace("+" + data?.prefix, "")
                if(this.phoneNumber.length > 2 && this.phoneNumber.substr(0, 2) == data?.prefix){
                    this.phoneNumber = this.phoneNumber.substring(2)
                }
            }
        },

        passEmit(event: string, arg?: any) {
            this.$emit(event, arg);
        },
        
        updateValue(value: any) {
            this.$emit('update:modelValue', value.number);
            this.$emit('update:prefix', value.prefix);
            this.$emit('update:country', value.country);
            this.$emit('change', value);
        },

        getPhoneData() {
            if (!this.iti) return undefined;
            const data = this.iti.getSelectedCountryData();
            const number = this.ref('input').value;

            return {
                country: data.iso2,
                prefix: data.dialCode,
                number: number.replace(/\D/g, ''),
                fullnumber: '+' + data.dialCode + number
            }
        },

        setPhoneCountry(country: string) {
            if (!this.iti) return country;
            this.iti.setCountry(country);
        },
    }
});