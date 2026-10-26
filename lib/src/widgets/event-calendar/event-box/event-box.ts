import { defineComponent } from 'vue';

export default defineComponent({

    props: [ 'event', 'displayInterval', 'bulletEvents', 'positionEvents' ],

    data() {
        const data : {
            listener: any
        } = {
            listener: null
        }

        return data;
    },

    methods: {

        styleForBox() {
            const obj : any = {
                'border-radius': '3px'
            }

            if (!this.bulletEvents) {
                obj['flex'] = 1;
                obj['border-left'] = 'solid 3px ' + this.event.color;
            } else {
                obj['border-radius'] = '10px';
                obj['font-size'] = '12px';
                obj['padding'] = '3px 10px';

                if (this.positionEvents) {

                    obj['position'] = 'absolute';
                    obj['top'] = '0';
                    obj['left'] = '0';
                    obj['width'] = '100%';

                    const minute = this.event.date.get('minute');
                    const top = (minute / 60.0 * 100.0);
                    obj['top'] = top + '%';
    
                    if (this.event.end) {
                        const minutes = this.event.date.diff(this.event.end).minutes;
                        const perc = (minutes / 60.0 * 100.0).toFixed(2);
    
                        obj['height'] = perc + '%';
                    }
                } else {
                    obj['margin-bottom'] = '3px';
                }

            }

            return obj;
        },

        displayPopup() {
            this.event.popupVisible = 1;

            setTimeout(() => {
                this.event.popupVisible = 2;
                this.$forceUpdate();
            }, 5);
        },

        hidePopup() {
            if (this.event.popup && this.event.popupVisible > 0) {
                this.event.popupVisible = 1;
                document.body.removeEventListener('click', this.listener, true);
                this.listener = null;
                this.$forceUpdate();

                setTimeout(() => {
                    this.event.popupVisible = 0;
                    this.$forceUpdate();
                }, 300);
            }
        },

        handleClick(event: any) {
            if (event.onClick) {
                event.onClick();
                return;
            }

            if (event.popup) {

                if (event.popupVisible == 0) {
                    this.displayPopup();

                    if (this.listener) {
                        document.body.removeEventListener('click', this.listener, true);
                    }

                    this.listener = () => {
                        setTimeout(() => {
                            this.hidePopup();
                        }, 50);
                    };

                    setTimeout(() => {
                        document.body.addEventListener('click', this.listener, true); 
                    }, 10);

                }

                this.$forceUpdate();

            }
            
        },

        timeLabel() {
            let str = this.event.date.time();
            if (this.event.end) {
                str += ' - ' + this.event.end.time();

                if (this.displayInterval) {
                    const diff = this.event.date.diff(this.event.end).all;
                    const m = diff.minutes;
                    const h = diff.hours;

                    if (h > 0 || m > 0) {
                        str += ' (';

                        if (h > 0)
                            str += h + 'h';

                        if (m > 0) {
                            if (h > 0) {
                                str += ' ';
                            }

                            str += m + "'";
                        }

                        str += ')'
                    }

                }
            }
            return str;
        }
    }

})