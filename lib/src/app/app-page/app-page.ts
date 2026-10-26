import { defineComponent } from "vue";
import HeadManager from "../../modules/head-manager";
import Config from "../../modules/config";
import AppGlobalWidgets from "../app-global-widgets/app-global-widgets.vue";
import DefaultLayout from "./default-layout.vue";

export default defineComponent({

    components: { AppGlobalWidgets, DefaultLayout },

    props: {
        name: {
            type: String
        },
        layout: {
            type: String
        },
        head: {
            type: String
        },
        title: {
            type: String
        }
    },

    data() {
        const data: {
            loading: boolean,
            loadscreenComponent: any
        } = {
            loading: false,
            loadscreenComponent: null
        }
        return data;
    },

    watch: {
        head() {
            this.updateHead();
        },
        title() {
            this.updateHead();
        }
    },

    created() {
        setTimeout(() => {
            this.updateHead();
        }, 5)
    },

    methods: {

        updateHead() {
            HeadManager.removePreviousAddedElements();
            if (this.title) {
                HeadManager.setTitle(this.title);
            }
            if (this.head) {
                HeadManager.addLines(this.head);
            }
        },

        getLayout() {
            const layouts = Config.layouts();
            if (!this.layout || !layouts[this.layout]) {

                if (layouts['default']) {
                    return layouts['default'];
                }

                return DefaultLayout;
            }
            return layouts[this.layout];
        }
    }

});