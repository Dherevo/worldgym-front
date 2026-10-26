import { defineComponent } from 'vue';
import baseInput from '../base-input';
import Time from '../../../../modules/time';
import DatePicker from 'primevue/datepicker';

export default defineComponent({

    components: { DatePicker },

    mixins: [baseInput],

    props: {
        range: {
            type: Boolean
        },
        dateFormat: {
            type: String
        },
        selectionMode: {
            type: String
        },
        returnFormat: {
            type: String,
            default: 'Time'
        },
        readonlyFormat: {
            type: String,
            default: 'DD/MM/YYYY'
        },
        min: {
            type: String
        },
        max: {
            type: String
        }
    },

    emits: [
        'update:modelValue',
    ],

    data() {
        const data : {
            dateValue: Date|Date[]|null,
            minDate?: Date,
            maxDate?: Date
        } = {
            dateValue: null,
            minDate: undefined,
            maxDate: undefined
        };
        return data;
    },

    watch: {
        modelValue(newValue: any) {
            this.updateLocalValue(newValue);
        },
        min(newValue: any) {
            this.minDate = Time.instance(newValue).toDate();
        },
        max(newValue: any) {
            this.maxDate = Time.instance(newValue).toDate();
        }
    },

    created() {
        this.updateLocalValue();

        if (this.min) {
            this.minDate = Time.instance(this.min).toDate();
        }
        if (this.max) {
            this.maxDate = Time.instance(this.max).toDate();
        }
    },

    methods: {

        readonlyText() {
            if (!this.modelValue) return '';
            if (this.range) {
                const a = this.modelValue.length > 0 ? this.modelValue[0] : undefined;
                const b = this.modelValue.length > 1 ? this.modelValue[1] : undefined;

                const strA = a ? a.format(this.readonlyFormat) : '';
                const strB = b ? b.format(this.readonlyFormat) : '';

                return strA + ' - ' + strB;
            }
            return this.modelValue.format(this.readonlyFormat);
        },

        getMode() {
            // Selection model
            let mode = 'simple';
            if (this.range)
                mode = 'range';
            else if (this.selectionMode)
                mode = this.selectionMode;
            return mode;
        },

        getReturnFormat() {
            return this.returnFormat ? this.returnFormat.toLowerCase() : undefined;
        },

        updateLocalValueSimpleInput() {
            const rt = this.getReturnFormat();
            const t = Time.instance(this.modelValue, rt == 'time' ? undefined : this.returnFormat);
            this.dateValue = t.toDate();
        },

        updateLocalValueMultipleInput(val: any) {

            const rt = this.getReturnFormat();

            if (Array.isArray(val)) {
                const aux: any[] = [];
                for(const dt of val) {
                    if (rt == 'date') {
                        aux.push(dt);
                    } else if (rt == 'time') {
                        aux.push(dt.toDate())
                    } else {
                        aux.push(Time.instance(dt, this.returnFormat));
                    }
                }
                this.dateValue = aux;
            }
        },

        updateLocalValueRangeInput(val: any) {
            const rt = this.getReturnFormat();
            const aux: any[] = [];
            for(const dt of val) {
                if (!dt) {
                    aux.push(dt);
                }
                else if (rt == 'date') {
                    aux.push(dt);
                } else if (rt == 'time') {
                    aux.push(dt.toDate())
                } else {
                    aux.push(Time.instance(dt, this.returnFormat));
                }
            }
            this.dateValue = aux;
        },

        updateLocalValue(value?: any) {
            const val = value !== undefined ? value : this.modelValue;
            if (val === null || val === undefined || val === "") return;

            const rt = this.returnFormat ? this.returnFormat.toLowerCase() : undefined;

            if (rt && rt != 'date') {

                const mode = this.getMode();

                if (mode == 'simple') {
                    this.updateLocalValueSimpleInput();
                }
                else if (mode == 'multiple') {
                    this.updateLocalValueMultipleInput(val);
                }
                else if (mode == 'range' && Array.isArray(val)) {
                    this.updateLocalValueRangeInput(val);
                }

            }  
        },

        setValue(value: any) {
            this.$emit('update:modelValue', value);
        },

        updateValueSimple(value: any) {
            const rt = this.getReturnFormat();

            // Value to be used, once converted to the "rt" format.
            const val : any = rt == 'date' ? value
            : (rt == 'time' ? Time.fromDate(value) : Time.fromDate(value).format(this.returnFormat));

            this.setValue(val);
        },

        updateValueMultiple(value: any) {
            const rt = this.getReturnFormat();
            const aux: any[] = [];
            if (value) {
                for(const d of value) {
                    // Value to be used, once converted to the "rt" format.
                    const val : any = rt == 'date' ? d
                    : (rt == 'time' ? Time.fromDate(d) : Time.fromDate(d).format(this.returnFormat));
                    aux.push(val);
                }
            }
            this.setValue(aux);
        },

        updateValueRange(value: any) {
            const rt = this.getReturnFormat();

            const aux: any[] = [];
            if (value) {
                for(const d of value) {

                    if (!d) {
                        aux.push(d);
                        continue;
                    }

                    // Value to be used, once converted to the "rt" format.
                    const val : any = rt == 'date' ? d
                    : (rt == 'time' ? Time.fromDate(d) : Time.fromDate(d).format(this.returnFormat));
                    aux.push(val);
                }
            }
            this.setValue(aux);
        },

        updateValue(value: any) {

            // Selection mode
            let mode = 'simple';
            if (this.range) {
                mode = 'range';
            }
            else if (this.selectionMode) {
                mode = this.selectionMode;
            }

            if (mode == 'simple')
                this.updateValueSimple(value);

            else if (mode == 'multiple')
                this.updateValueMultiple(value);

            else if (mode == 'range')
                this.updateValueRange(value);
        },

        bindProps() {
            let obj : any = {}
    
            obj = {
                ...obj,
                inputId: this.inputName
            }

            if (obj['showIcon'] === undefined) {
                obj['showIcon'] = true;
            }

            if (this.dateFormat) {
                obj['dateFormat'] = this.dateFormat
            }

            if (this.range) {
                obj['selectionMode'] = 'range';
            }

            if (obj['selectionMode'] == 'range' && obj['showTime'] &&
                (!this.dateValue || (Array.isArray(this.dateValue) && this.dateValue.length == 0))) {
                    obj['showTime'] = false;
            }
             
            return obj;
        }
    }
});