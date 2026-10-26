import { defineComponent, PropType } from 'vue';
import Loader from '../loader/loader.vue';

export default defineComponent({

    components: {Loader},

    props: {
        threshold: {
            type: Number
        },
        list: {
            type: Object as PropType<any[]>
        },
        emptyMessage: {
            type: String
        },
        reverse: {
            type: Boolean
        },
        scroller: {}
    },

    emits: ['scrolling', 'load'],

    data() {
        const data : {
            loading: boolean,
            finished: boolean,
            scrollPosition: number
        } = {
            loading: false,
            finished: false,
            scrollPosition: 0
        }

        return data;
    },

    created() {
        this.load();

        this.el().addEventListener('scroll', () => {
            this.handleScroll();
        });
    },

    methods: {

        scrollTo(position: number) {
            (this.$refs.container as any).scrollTop = position;
        },

        el() : any {
            if (this.scroller === 'self') return this.$refs.container;
            return this.scroller ? this.scroller : (window as any);
        },

        detectScroll() {

            const e = this.el();

            let position = 0;
            if (this.scroller) {
                position = e.scrollTop + e.clientHeight;
            } else {
                position = e.scrollY + e.innerHeight;
            }
            
            const mark = (this.$refs.mark as any);
            const container = (this.$refs.container as any);
            if (!container) return;
            const threshold = this.threshold ? this.threshold : 50;

            this.scrollPosition = container.scrollTop;
            this.$emit('scrolling', this.scrollPosition);

            if (!this.reverse) {
                if (position + container.scrollTop >= mark.offsetTop - threshold) {
                    return true;
                }
            } else {
                if (container.scrollTop <= mark.offsetTop + threshold) {
                    return true;
                }
            }

            return false;

        },

        handleScroll() {
            if (this.loading) return;
            if (this.finished) return;

            if (this.detectScroll()) {
                this.load();
            }
        },

        reset() {
            this.loading = false;
            this.finished = false;
            this.load();
        },

        load() {
            this.loading = true;

            this.$emit('load', {
                stop: (finish: boolean = false) => {
                    this.loading = false;
                    this.finished = finish;
                }
            });
        }
    }

});