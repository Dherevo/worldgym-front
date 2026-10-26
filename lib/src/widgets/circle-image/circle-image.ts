import { defineComponent, PropType } from 'vue';

export default defineComponent({

    props: {
        size: {
            type: Object as PropType<number|string>
        },
        src: {
            type: String,
            required: true
        }
    },

    methods: {
        imageStyle() {

            const style : any = {
                'background-image': "url('"+ this.src +"')"
            };
    
            if (this.size) {
    
                style['width'] = this.size + 'px';
                style['min-width'] = this.size + 'px';
                style['height'] = this.size + 'px';
    
            }
    
            return style;
        }
    }

})