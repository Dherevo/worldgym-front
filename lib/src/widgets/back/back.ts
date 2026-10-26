import { defineComponent } from 'vue';

export default defineComponent({

    props: {
        size: {
            type: Number
        }
    },

    emits: [
        'click'
    ],

    methods: {
        getStyle() {
            const s = this.size ? this.size : 30;

            return {
                width: s + 'px',
                height: s + 'px',
                cursor: 'pointer'
            }
        },
        doClick() {
            if (this.$attrs.onClick)
                this.$emit('click');
            else
                this.back();
        }
    }
});