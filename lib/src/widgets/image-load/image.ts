import { defineComponent } from 'vue';

export default defineComponent({

    props: {
        src: {
            type: String
        },
        height: {
            type: Number
        },
        width: {
            type: Number
        },
        placeholder: {
            type: String
        },
        background: {
            type: Boolean
        }
    },

    data() {
        const data : {
            loaded: boolean,
            error: boolean
        } = {
            loaded: false,
            error: false
        }

        return data;
    },

    watch: {
        $props: {
        handler() {
            this.loadBG();
        },
        deep: true,
        immediate: true,
        },
    },

    created() {
        if (!this.background && !this.src) {
            this.imgError();
        }
    },

    mounted() {
        this.loadBG();
    },

    methods: {
        imgError() {
            this.loaded = true;
            this.error = true;
        },

        loadBG() {
            if (this.background) {

                if (this.src) {
                    const img = new Image();
    
                    img.onload = () => {
                        this.loaded = true;
                        this.setBGImage(img.src);
                    }
                    img.onerror = () => {
                        this.loaded = true;
                        this.error = true;
                        if (this.placeholder)
                        this.setBGImage(this.placeholder);
                    }
                    img.src = this.src;
                }
                else {
                    if (this.placeholder)
                        this.setBGImage(this.placeholder);
                }
    
            }
        },

        setBGImage(src: any) {
            const e = (this.$refs.backgroundElem as any);
            if (!e) return;
            e.style.backgroundImage = "url(" + src + ")";
        }
    },

});