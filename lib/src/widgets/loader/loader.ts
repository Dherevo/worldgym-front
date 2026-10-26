import { defineComponent } from 'vue';

export default defineComponent({

    props: {
        size: {
            type: Number
        },
        color: {
            type: String
        },
        backcolor: {
            type: String
        },
        label: {
          type: String
        }
    },

    methods: {
      generateStyle() {
        const st : any = {}

        if (this.size) {
          st['width'] = this.size + 'px';
          st['height'] = this.size + 'px';

          st['border-width'] = (Math.ceil(this.size / 10)) + 'px';
        }

        if (this.backcolor) {
          st['border-color'] = this.backcolor;
          st['border-top-color'] = this.color ? this.color : 'var(--primary-color)';
        }

        if (this.color) {
          st['border-top-color'] = this.color;
        }

        return st;
      }
    }

})