import { defineComponent } from 'vue';
import VideoPlayer from '../video-player/video-player.vue';

export default defineComponent({

    components: { VideoPlayer },

    props: {
        src: {
            type: String,
            default: undefined
        },
        opacity: {
            type: Number,
            default: .5
        }
    },

    data() {
        const data : {
            player: any
        } = {
            player: null
        }
        return data;
    },

    mounted() {
        const e : any = this.$refs.video;
        if (!e) return;
        this.player = e.getPlayer();
        if (!this.player) return;
    },

    methods: {
        videoSize() {
            if (!this.player) return;

            const container : any = this.$refs.container;
            if (!container) return;

            const obj : any = {opacity: this.opacity}

            const w = container.clientWidth;
            const h = container.clientHeight;

            const width = this.player.videoWidth;
            const height = this.player.videoHeight;

            if (w >= h) {

                if (width >= w) {
                    obj['height'] = '100%';
                    obj['width'] = 'auto';
                    obj['margin-left'] = (- (w - width) / 2) + "";
                    obj['margin-top'] = "0";
                } else {
                    obj['height'] = 'auto';
                    obj['width'] = '100%';
                    obj['margin-left'] = "0";
                    obj['margin-top'] = (- (h - height) / 2) + "";
                }

            } else {

                if (height >= h) {
                    obj['height'] = 'auto';
                    obj['width'] = '100%';
                    obj['margin-left'] = "0";
                    obj['margin-top'] = (- (h - height) / 2) + "";
                } else {
                    obj['height'] = '100%';
                    obj['width'] = 'auto';
                    obj['margin-left'] = (- (w - width) / 2) + "";
                    obj['margin-top'] = 0;
                }

            }

            return obj;
        }
    }

})