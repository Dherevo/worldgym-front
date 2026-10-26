import { PropType, defineComponent } from 'vue';

export default defineComponent({

    props: {
        position: {
            type: String as PropType<'left'|'right'>,
            default: 'left'
        },
        expand: {
            type: String as PropType<'bottom'|'top'>,
            default: 'bottom'
        },
        icon: {
            type: String as PropType<string>
        },
        startOpen: {
            type: Boolean,
            default: false
        },
        autoClose: {
            type: Boolean,
            default: false
        },
        onOpen: {
            type: Object as PropType<() => void>
        },
        automatic: {
            type: Boolean,
            default: true
        },
        dropdownStyle: {
            type: Boolean,
            default: false
        }
    },

    data() {
        const data : {
            open: boolean,
            mustclose: boolean,
            zIndexChanges: any
        } = {
            open: this.startOpen ? true : false,
            mustclose: true,
            zIndexChanges: []
        }

        return data;
    },

    created() {
        window.addEventListener('click', () => {
            setTimeout(() => {
                if (!this.mustclose) return;
                this.open = false;
                this.restoreZIndex();
            }, 10);
        });
    },

    methods: {
        togglePopup() {
            if (this.open) {
                this.closePopup();
            }
            else {
                this.openPopup();
            }
        },

        openPopup() {
            this.mustclose = false;
            this.open = true;
            this.adaptZIndex();

            setTimeout(() => {
                if (this.onOpen) {
                    this.onOpen();
                }
                this.adaptZIndex();
            }, 10);

            setTimeout(() => {
                this.mustclose = true;
            }, 50);
        },

        closePopup() {
            this.open = false;
        },

        adaptZIndex() {
            const popup : HTMLElement = this.$refs.popup as HTMLElement;
            if (!popup) return;

            let e = popup.parentElement;
            while (e) {
                
                if (!this.zIndexChanges.find((item: any) => item.element == e) && (e.style.zIndex || e.tagName == 'TR')) {
                    this.zIndexChanges.push({
                        element: e,
                        zIndex: e.style.zIndex
                    });

                    e.style.zIndex = '9999';
                }

                e = e.parentElement;
            }
        },

        restoreZIndex() {
            this.zIndexChanges.forEach((z: any) => {
                z.element.style.zIndex = z.zIndex;
            });
            this.zIndexChanges = [];
        },

        animationCSS() {
            const css: any = {
                'transform-origin': 
                    (this.expand == 'bottom' ? 'top' : 'bottom') + ' '
                    +
                    (this.position == 'left' ? 'right' : 'left')
            }

            if (this.position == 'left') {
                css['right'] = '50%';
            } else {
                css['left'] = '50%';
            }

            if (this.expand == 'bottom') {
                css['top'] = '100%';
            } else {
                css['bottom'] = '100%';
            }

            return css;
        },

        clickOnContent(e: any) {
            e.stopPropagation();
            e.preventDefault();

            if (!this.autoClose) {
                this.mustclose = false;
                setTimeout(() => {
                    this.mustclose = true;
                }, 50);
            }
            else {
                this.closePopup();
            }
        }
    }

});