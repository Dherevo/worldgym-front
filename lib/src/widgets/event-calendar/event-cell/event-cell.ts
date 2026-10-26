import { defineComponent } from 'vue';
import Time from '../../../modules/time';
import EventBox from '../event-box/event-box.vue';

export default defineComponent({

    components: {EventBox},

    props: [ 'emptyCell', 
    'addOnHover', 
    'day', 
    'hour', 
    'hourname', 
    'direction', 
    'time', 
    'mode', 
    'displayInterval', 
    'bulletEvents', 
    'positionEvents',
    'addIconBelow'],

    methods: {

        getTime() {
            return new Time(
                this.day.time.format('YYYY-MM-DD') + ' ' + this.hour.number + ':00:00'
            );
        },
  
        handleEmptyCell() {
            if (this.emptyCell) {
                this.emptyCell(this.getTime());
                return;
            }
            if (this.addOnHover) {
                this.addOnHover(this.getTime());
            }
        },

        getEvents(day: any) {
            if (!this.mode || this.mode != 'month')
                return day.hours[this.hourname].events;
            else
                return day.events;
        }
    }

})