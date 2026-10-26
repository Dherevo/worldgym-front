
import { defineComponent, PropType } from 'vue';
import Utils from '../../modules/utils';
import Time from '../../modules/time';
import EventCell from './event-cell/event-cell.vue';
import EventBox from './event-box/event-box.vue';
import Btn from '../btn/btn.vue';

type CalendarEventItem = {
    text?: string,
    date?: string,
    end?: string,
    color?: string,
    meet?: string,
    link?: string,
    onClick?: () => void,
    popup?: boolean
    popupVisible?: boolean
}

type CalendarEvent = {
    text: string,
    date: Time,
    end?: Time,
    color: string,
    meet?: string,
    link?: string,
    onClick?: () => void,
    popup?: boolean
    popupVisible?: boolean
}

export default defineComponent({

    components: { EventCell, EventBox, Btn },

    props: {
        mode: {
            type: String as PropType<'day'|'week'|'month'>
        },
        events: {
            type: Object as PropType<CalendarEventItem[]>
        },
        starthour: {
            type: Number
        },
        endhour: {
            type: Number
        },
        addOnHover: {
            type: Function
        },
        emptyCell: {
            type: Function
        },
        modelValue: {
            type: Object as PropType<any>
        },
        displayEventInterval: {
            type: Boolean
        },
        bulletEvents: {
            type: Boolean
        },
        positionEvents: {
            type: Boolean
        },
    },

    emits: [
        'change',
        'input',
    ],

    data() {
        const data : {
            _monthDays: any,
            _weekDays: any,
            _day: any,
            today: string,
            pseudoValue: Time
        } = {
            _monthDays: null,
            _weekDays: null,
            _day: null,
            today: Time.instance().date(),
            pseudoValue: new Time()
        }

        return data;
    },

    watch: {
        modelValue() {
            this.reset();
        },
        events() {
            this.reset();
        },
    },

    methods: {

        getValue() {
            return this.modelValue ? this.modelValue : this.pseudoValue;
        },

        toDate(date: Time) {
            this.$emit('input', date);
            this._monthDays = null;
            this._weekDays = null;
            this._day = null;
            this.$forceUpdate();
        },

        parseEvents() {
            if (!this.events) return [];

            return this.events.map((item: CalendarEventItem) => {

                const it : CalendarEvent = Utils.force(item, {
                    text: '',
                    date: '',
                    end: null,
                    color: 'green',
                    meet: null,
                    link: null,
                    onClick: null,
                    popup: null,
                    popupVisible: 0
                });

                it.date = new Time(it.date);
                it.end = it.end ? new Time(it.end) : undefined;

                return it;
            });
        },

        getMonthDays() {
            if (this._monthDays) return this._monthDays;

            const first = this.getValue().getFirstOfMonth().getMonday();
            const last = this.getValue().getLastOfMonth().getSunday().add(1);

            const list: any = {}

            const thisMonth = this.getValue().format('MM');

            while(last.isAfter(first)) {

                const item : any = {
                    time: first.copy(),
                    same: first.format('MM') == thisMonth,
                    dayNumber: first.format('DD'),
                    events: []
                };

                list[first.format('YYYY-MM-DD')] = item;
                first.add(1);

            }

            const evs = this.parseEvents();

            for(const ev of evs) {

                const id = ev.date.format('YYYY-MM-DD');
                if (!list[id]) {
                    continue;
                }

                list[id].events.push(ev)
            }

            Object.keys(list)
            .forEach(id => {

                const evs : any[] = list[id].events;
                if (!evs) return;

                evs.sort((a: any, b: any) => {
                    if (a.date.datetime() < b.date.datetime()) {
                        return -1;
                    }
                    return 1;
                });

            });

            this._monthDays = list;
            return list;
        },

        getWeekDays() {
            if (this._weekDays) return this._weekDays;

            const first = this.getValue().getMonday();
            const list : any = {};

            for(let i = 0; i < 7; ++i) {
                const item : any = {
                    time: null,
                    hours: {}
                }
                if (i == 0) 
                    item.time = first;
                else 
                    item.time = first.copy().add(i);

                for(let j = 0; j < 24; ++j) {
                    let str = "" + j;
                    if (str.length < 2)
                        str = "0" + str;

                    item.hours["d" + str] = {
                        number: str,
                        events: []
                    }
                }

                list[item.time.format('MM/DD')] = item;
            }

            // Place events
            if (!this.events || this.events.length == 0) {
                this._weekDays = list;
                return list;
            }

            const evs = this.parseEvents();

            for(const ev of evs) {

                const id = ev.date.format('MM/DD');
                if (!list[id]) {
                    continue;
                }

                const hour = ev.date.format('HH');
                if (!list[id].hours["d" + hour]) {
                    continue;
                }

                list[id].hours["d" + hour].events.push(ev);
            }

            Object.keys(list)
            .forEach(id => {

                Object.keys(list[id].hours)
                .forEach(hour => {

                    const evs : any[] = list[id].hours[hour].events;
                    if (!evs) return;

                    evs.sort((a: any, b: any) => {
                        if (a.date.datetime() < b.date.datetime()) {
                            return -1;
                        }
                        return 1;
                    });

                })

            });

            this._weekDays = list;
            return list;
        },

        firstDay() {
            const keys = Object.keys(this._weekDays);
            return keys.length > 0 ? this._weekDays[keys[0]] : null;
        },

        getDay() {
            if (this._day) return this._day;

            const md = this.getValue().format('MM/DD');

            const list = this.getWeekDays();
            if (!list[md]) return null;

            this._day = list[md];
            return this._day;
        },

        dayTitle() {
            return Utils.capitalize(this.getValue().format('dddd, DD')) + ' ' + Utils.capitalize(this.getValue().format('MMMM'));
        },

        monthTitle() {
            return Utils.capitalize(this.getValue().format('MMMM'));
        },

        yearTitle() {
            return this.getValue().format('YYYY');
        },

        daynames() {
            const monday = this.getValue().getMonday();
            const daynames : string[] = [];

            for(let i = 0; i < 7; ++i) {
                daynames.push(Utils.capitalize(monday.format('dddd')));
                monday.add(1);
            }

            return daynames;
        },

        getDisplayHours() {
            const result: any = {}
            const hours = this.firstDay().hours;
            const keys = Object.keys(hours);

            const starth = this.starthour ? this.starthour : 0;
            const endh = this.endhour ? this.endhour : 24;

            for(const k of keys) {
                const hour = hours[k];

                if (Number(hour.number) >= starth
                && Number(hour.number) < endh) {
                    result[k] = hours[k];
                }
            }

            return result;
        },

        reset() {
            this._day = null;
            this._weekDays = null;
            this._monthDays = null;
            this.$forceUpdate();
        },

        next() {
            if (this.mode == 'day') {
                this.getValue().add(1);
            } else if (this.mode == 'month') {
                this.getValue().add(
                    this.getValue().daysThisMonth - Number(this.getValue().get('day')) + 1
                );
            } else { // week
                this.getValue().add(7);
            }
            this.reset();
            this.$emit('change', this.getValue());
        },

        previous() {
            if (this.mode == 'day') {
                this.getValue().add(-1);
            }  else if (this.mode == 'month') {
                this.getValue().add(
                    - this.getValue().get('day')
                );
            } else { // week
                this.getValue().add(-7);
            }
            this.reset();
            this.$emit('change', this.getValue());
        },

        groupOfSeven() {
            const groupsOfSeven : any[] = [];
            let currentGroup : any[] = [];
            Object.keys(this._monthDays ?? {}).forEach((index: any) => {
                currentGroup.push(index);
                if (currentGroup.length == 7) {
                    groupsOfSeven.push(currentGroup);
                    currentGroup = [];
                }
            });
            return groupsOfSeven;
        }
    }

})