import Config from '../../modules/config';
import { defineComponent } from 'vue';

export default defineComponent({

    props: {
        name: {type: String, required: true}
    },

    data() {
        const data : {
            iconName: string,
            lib: string
        } = {
            iconName: '',
            lib: ''
        }
        return data;
    },

    watch: {
        $props: {
            handler() {
                this.parseName();
            },
            deep: true,
            immediate: true,
        },
    },

    created() {
        this.parseName();
    },

    methods: {

        parseName() {
            this.iconName = this.name;
            if (this.name.indexOf('/') >= 0) {
                const parts = this.name.split('/');
                this.iconName = parts[1];
                this.lib = parts[0];
            }
        },

        iconStyle() {
            if (this.$attrs.onClick) {
                return {cursor: 'pointer'}
            }
            return {}
        },

        cacheLabel() {
            return Config.get('disableSvgIconsCache', false) ? '?time=' + (new Date().getTime()) : '';
        }
    },

});