
import { defineComponent, PropType } from 'vue';
import Loader from '../loader/loader.vue';
import Link from '../link/link.vue';

export default defineComponent({

    components: { Loader, Link },

    props: {
        loading: {
            type: [Boolean, Function] as PropType<boolean | (()=>boolean)>
        },
        disabled: {
            type: [Boolean, Function] as PropType<boolean | (()=>boolean)>
        },
        content: {
            type: String
        },
        fill: {
            type: Boolean
        },
        center: {
            type: Boolean
        },
        rounded: {
            type: Boolean
        },
        ripple: {
            type: Boolean
        },
        color: {
            type: String
        },
        nude: {
            type: Boolean
        },
        link: {
            type: String
        },
        target: {
            type: String
        },
        stop: {
            type: Boolean
        }
    },

    emits: [
        'click'
    ],

    data() {
        return {
            defaultSize: {
                width: 0,
                height: 0
            }
        }
    },

    mounted() {
        const ref = (this.$refs as any).root;
        if (!ref) return;
        this.defaultSize = {
            width: ref.clientWidth,
            height: ref.clientHeight
        }
    },

    methods: {

        isDisabled() : boolean {
            if (!this.disabled) return false;
            if (typeof this.disabled == 'boolean') return this.disabled;
            return this.disabled();
        },

        isLoading() : boolean {
            if (!this.loading) return false;
            if (typeof this.loading == 'boolean') return this.loading;
            return this.loading();
        },

        clickAction($event: any) {
            if (this.stop !== undefined && this.stop !== false) {
                $event.preventDefault();
                $event.stopImmediatePropagation();
                $event.stopPropagation();
            }

            if (this.isDisabled() || this.isLoading()) {
                return;
            }

            this.$emit('click', $event);
        },

        btnStyle() {
            const st : any = {}

            if (this.loading && this.defaultSize.width > 0) {
                st['min-width'] = this.defaultSize.width + 'px';
                st['min-height'] = this.defaultSize.height + 'px';
            }

            if (this.color) {
                st['background-color'] = this.color;
            }

            return st;
        }

    }

})