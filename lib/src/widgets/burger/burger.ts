import { defineComponent, PropType } from 'vue';

export default defineComponent({

    props: {
        color: {
            type: String
        },
        modelValue: {
            type: Boolean
        },
        static: {
            type: Object as PropType<boolean|'desktop-only'>
        }
    },

    emits: [
        'click',
        'change',
        'update:modelValue'
    ],

    data() {
        const data : {
            open: boolean,
            lastShouldBeStatic: boolean
        } = {
            open: false,
            lastShouldBeStatic: false
        }

        return data;
    },

    watch: {
        modelValue(value) {
            this.open = value;
        }
    },

    created() {
        if (this.modelValue) {
            this.open = this.modelValue;
        }

        if (this.static === 'desktop-only') {
            window.addEventListener('resize', () => {
                const should = this.shouldBeStatic();
                if (should !== this.lastShouldBeStatic) {
                    this.lastShouldBeStatic = should;
                }
            });
        }
    },

    methods: {

        shouldBeStatic() {
            return this.static === undefined ? false : (
                this.static === 'desktop-only' ?
                window.innerWidth >= 768 : this.static)
            ;
        },

        getColor() {
            if (this.color) return this.color;
            return 'black';
        },

        toggle() {
            this.open = !this.open;

            this.$emit('click', this.open);
            this.$emit('update:modelValue', this.open);
        }
    }
});