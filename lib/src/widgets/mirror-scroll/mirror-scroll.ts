import { defineComponent, PropType } from 'vue';

export default defineComponent({

    props: {
        scroller: {
            type: Object as PropType<any[]>
        }
    },

    data() {
        const data : {
            initialized: boolean
        } = {
            initialized: false
        }

        return data;
    },

    watch: {
        scroller() {
            this.initialized = false;
            this.mirrorScroll();
        }
    },

    mounted() {
        setTimeout(() => {
            this.mirrorScroll();
            window.addEventListener('resize', this.mirrorScroll);
        }, 10);
    },

    methods: {
        mirrorScroll() {
            if (!this.scroller) return;
            if (this.scroller.length != 2) return;
            const scroller = this.scroller[0].$refs[this.scroller[1]];
            const ref = (this.$refs as any).mirror;
            if (!scroller || !ref) return;
    
            const w = scroller.firstElementChild.clientWidth;
            ref.firstElementChild.style.width = `${w}px`;
    
            if (!this.initialized) {
                this.initialized = true;
    
                scroller.addEventListener('scroll', (e: any) => {
                    ref.scrollLeft = e.target.scrollLeft;
                    this.mirrorScroll();
                });
    
                ref.addEventListener('scroll', (e: any) => {
                    if (!scroller) return;
                    scroller.scrollLeft = e.target.scrollLeft;
                    this.mirrorScroll();
                });
            }
        }
    }
});