import { defineComponent, PropType } from 'vue';

type SocialNetwork = {
    url?: string,
    text?: string,
    image?: string,
    color?: string,
    background?: boolean
}

export default defineComponent({

    props: {
        networks: {
            type: Object as PropType<any>
        },
        share: {
            type: Object as PropType<{
                url?: string,
                text?: string,
                image?: string
            }>
        }
    },

    methods: {

        iconFor(name: string) {
            if (name == 'x') return 'x-twitter';
            if (name == 'facebook') return 'facebook-f';
            if (name == 'linkedin') return 'linkedin-in';
            return name;
        },

        colorFor(name: string, ops: SocialNetwork, background: boolean = false) {
            if (ops.color != 'auto') return '';

            if (ops.background && !background) {
                return 'white';
            }

            if (name == 'facebook') return 'rgb(62, 81, 149)';
            if (name == 'instagram') return 'rgb(189, 61, 135)';
            if (name == 'linkedin') return 'rgb(49, 113, 172)';
            if (name == 'twitter') return 'rgb(101, 164, 228)';
            if (name == 'x') return 'rgb(0,0,0)';
            if (name == 'pinterest') return 'rgb(181, 50, 47)';
            if (name == 'whatsapp') return 'rgb(98, 205, 85)';
            if (name == 'youtube') return 'rgb(227, 49, 34)';
            return '';
        },

        shareLink(name: string, obj: SocialNetwork) {
            if (!this.share) return '';

            if (obj.url) return obj.url;

            if (name == 'facebook') {
                if (!this.share.url) return '';

                return 'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(this.share.url)
            }
            else if (name == 'twitter' || name == 'x') {
                if (!this.share.text) return '';

                return 'https://twitter.com/intent/tweet?text=' + encodeURIComponent(this.share.text);
            }
            else if (name == 'pinterest') {
                if (!this.share.url) return;

                let str = 'http://pinterest.com/pin/create/button/?url=' + encodeURIComponent(this.share.url);

                if (this.share.image) {
                    str += "&media=" + encodeURIComponent(this.share.image);
                }

                if (this.share.text) {
                    str += "&description=" + encodeURIComponent(this.share.text);
                }
                
                return str;
            }
        }
    }

})