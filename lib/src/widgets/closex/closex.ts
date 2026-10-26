import { defineComponent } from 'vue';

export default defineComponent({

    props: {
        size: {
            type: Number
        }
    },

    methods: {
        getStyle() {
            const s = this.size ? this.size : 20;

            return {
                width: s + 'px',
                height: s + 'px',
                cursor: 'pointer'
            }
        }
    }
});