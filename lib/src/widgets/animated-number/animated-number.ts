import { defineComponent } from 'vue';
import { CountUp } from 'countup.js';

export default defineComponent({

    props: {
        modelValue: {
            type: Number,
            required: true
        },
        decimals: {
            type: Number,
            default: 0
        },
        duration: {
            type: Number,
            default: 1
        },
        options: {
            type: Object,
            default: {}
        }
    },

    watch: {
        modelValue() {
            this.animate();
        }
    },

    mounted() {
        this.animate();
    },

    methods: {
        animate() {
            const e: any = this.$refs.numberElement;
            if (!e) return;

            const isInteger = this.modelValue % 1 === 0;
    
            const countUp = new CountUp(e, this.modelValue, {
                decimalPlaces: isInteger ? this.decimals : ( this.decimals == 0 ? 2 : this.decimals ),
                duration: this.duration,
                ...this.options
            });
            if (!countUp.error) {
                countUp.start();
            }
        }
    }
});