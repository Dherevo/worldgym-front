import { defineComponent } from 'vue';
import 'tippy.js/dist/tippy.css'; 
import tippy, {followCursor} from 'tippy.js';

export default defineComponent({
    props: {
        text: {
            type: String,
            required: true
        },
        position: {
            type: String,
        },
        props: {}
    },

    mounted() {

        const p = this.props as any;
        
        const plugins = [];
        if (p && p.followCursor) {
            plugins.push(followCursor);
        }

        tippy(this.$refs.tooltip as HTMLElement, {
            content: this.text,
            placement: this.position as any,
            appendTo: 'parent',
            ...(p ?? {}),
            plugins: [...plugins, ...(p && p.plugins ? p.plugins : [])],
        });
    }
})