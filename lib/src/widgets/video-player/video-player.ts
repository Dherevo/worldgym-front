import { defineComponent } from 'vue';

export default defineComponent({

    props: {
        src: {
            type: String,
            default: undefined
        },
        type: {
            type: String,
            default: 'video/mp4'
        },
        controls: {
            type: Boolean,
            default: true
        },
        autoplay: {
            type: Boolean,
            default: false
        },
        loop: {
            type: Boolean,
            default: false
        },
        muted: {
            type: Boolean,
            default: false
        }
    },

    data() {
        const data : {
            playOnInteraction: boolean,
            interactionListener: any
        } = {
            playOnInteraction: false,
            interactionListener: undefined
        }
        return data;
    },

    created() {
        if (this.autoplay && !this.muted) {
            this.playOnInteraction = true;
        }
    },

    mounted() {

        const v : any = this.$refs.video;

        if (this.autoplay !== false) {

            if (this.muted !== false) {
                v.play();
            }
            else {

                this.interactionListener = () => {
                    const v : any = this.$refs.video;
                    v.play();
                    document.removeEventListener('mousedown', this.interactionListener);
                };

                document.addEventListener('mousedown', this.interactionListener);
            }

        }

        if (typeof v.loop == 'boolean') { // loop supported
            v.loop = true;
        } 
        else { // loop property not supported
            v.addEventListener('ended', () => {
                v.currentTime = 0;
                v.play();
            }, false);
        }
    },

    methods: {
        getPlayer() {
            return this.$refs.video;
        }
    }

})