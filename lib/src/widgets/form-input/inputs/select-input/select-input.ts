import { defineComponent, PropType } from 'vue';
import Select from 'primevue/select';
import AutoComplete from 'primevue/autocomplete';
import DatePicker from 'primevue/datepicker';
import MultiSelect from 'primevue/multiselect';
import IOption from '../../../../interfaces/IOption';
import baseInput from '../base-input';

export default defineComponent({

    components: {
        Select,
        AutoComplete,
        DatePicker,
        MultiSelect
    },

    mixins: [baseInput],

    props: {
        placeholder: {
            type: String
        },
        options: {
            type: Array as PropType<IOption[]>
        },
        multiple: {
            type: Boolean,
            default: false
        },
        suggestions: {
            type: Function as PropType<((query: string, resolve: ((suggestions: IOption[]) => void)) => void)>
        },
        comparer: {
            type: Function as PropType<(a: any, b: any) => boolean>,
            default: (a: any, b: any) =>
            a !== undefined &&
            a !== null &&
            b !== undefined &&
            b !== null &&
            (a == b ||
              (a.id && b.id && a.id == b.id) ||
              (a.value && b.value && a.value == b.value))
        },
        footer: {},
        getOptionName: {
            type: Function as PropType<((value: string) => Promise<string>)>
        }
    },

    emits: [
        'blur',
        'focus',
        'keyup',
        'keydown',
        'update:modelValue',
        'complete',
        'pressEnter',
        'pressEscape',
        'tabPressed',
        'suggestion-selected',
        'stop',
        'close'
    ],

    data() {
        const data : {
            cachedOptions?: IOption[],
            selectedOptions: IOption[],
            selectOption: IOption|null,
            previousSuggestions: any[],
            emitAllowed: boolean
        } = {
            cachedOptions: undefined,
            selectedOptions: [],
            selectOption: null,
            previousSuggestions: [],
            emitAllowed: true
        }
        return data;
    },

    watch: {
        modelValue(newValue: any) {
            this.updateLocalValue(newValue);
        },
        options() {
            this.cachedOptions = undefined;
            this.updateLocalValue();
        }
    },

    mounted() {
        if (this.multiple && this.modelValue && Array.isArray(this.modelValue) && this.modelValue.length > 0) {

            const map : IOption[] = this.getDropdownOptions().slice();
            const selected : any[] = [];
            for(const item of this.modelValue) {
                for(const option of map) {
                    if (this.comparer!(item, option.value)) {
                        option.value = item;
                        selected.push(option);
                        const index = map.indexOf(option);
                        map.splice(index, 1);
                        break;
                    }
                }
            }
            this.selectedOptions = selected;
        }

        if (!this.multiple) {
            this.emitAllowed = false;
            this.updateLocalValue();
            this.emitAllowed = true;
        }

        if (this.suggestions && this.modelValue) {

            if (this.getOptionName) {
                this.getOptionName(this.modelValue as string)
                .then((name: string) => {
                    this.selectOption = {
                        value: this.modelValue,
                        content: name
                    }
                })
            } else {
                this.selectOption = {
                    value: this.modelValue,
                    content: this.modelValue as string
                }
            }
        }
    },

    methods: {

        bindProps() {
            const p = this.$props as any;
            const obj : any = {}

            obj['optionLabel'] = p['optionLabel'] ?? 'content';
             
            return obj;
        },

        setValue(value: any) {
            if (!this.emitAllowed) return;
            this.$emit('update:modelValue', value);
        },

        updateValue(value: any) {
            this.stopEvent(value);

            if (this.multiple) {
                const optionsMap = this.getDropdownOptionsMap();
                const selectedOptions: IOption[] = [];
                const arr: IOption[] = [];

                for (const i of value) {
                    if (!i) continue;
                    if (optionsMap[typeof i == 'object' ? i.id : i]) {
                        selectedOptions.push(optionsMap[typeof i == 'object' ? i.id : i])
                    }
                    arr.push(i);
                }
                this.selectedOptions = selectedOptions;
                this.setValue(arr);

            } else {

                if (value === undefined) {
                    this.selectOption = null;
                    this.setValue(value.value ?? value.content);
                } else {
                    this.selectOption = value;
                    this.setValue(value.value ?? value.content);
                }
            }
        },

        stopEvent(value?: any) {
            this.writeCount += 1;
            const currentWriteCount = this.writeCount;

            setTimeout(() => {
                if (currentWriteCount == this.writeCount) {
                    this.$emit('stop', value);

                    if (this.suggestions) {
                        this.suggestions(value, suggestions => {
                            this.updateSuggestions(suggestions);
                        });
                    }
                }
            }, this.stopTime);
        },

        updateLocalValueSingleDropdown(val: any) {
            if (this.selectOption && this.comparer(val, this.selectOption.value)) {
                return;
            }

            const list : any = this.options ? this.getDropdownOptions() : (this.suggestions ? this.suggestions : null);
            const isSelected = (v: any) => this.selectOption && v == this.selectOption;

            const checkOption = (op: IOption) => {
                if (!op.items) {
                    if (this.comparer(val, op.value)) {
                        if (isSelected(op)) return true;
                        this.selectOption = op;
                        this.setValue(op.value);
                        return true;
                    }
                } else {

                    for(const child of op.items) {
                        if (this.comparer(val, child.value)) {
                            if (isSelected(child)) return true;
                            this.selectOption = child;
                            return true;
                        }
                    }
                }

                return false;
            }

            if (list) {
                for(const op of list) {
                    if (checkOption(op)) break;
                }
            }
        },

        updateLocalValueMultipleDropdown(val: any) {
            const list: any = this.options
                ? this.getDropdownOptions()
                : this.suggestions
                ? this.suggestions
                : [];

            if (list && Array.isArray(val) && val.length > 0) {
                for (const op of list) {
                for (const o of val) {
                    if (this.comparer(op, o)) {
                    this.selectedOptions.push(op as any);
                    }
                }
                }
            }
        },

        updateLocalValue(value?: any) {

            const val = value !== undefined ? value : this.modelValue;
            if (val === null || val === undefined || val === "") return;

            if (this.suggestions) return;

            if (!this.multiple) {
                this.updateLocalValueSingleDropdown(val);
            } else if (this.selectedOptions.length == 0) {
                this.updateLocalValueMultipleDropdown(val);
            }
        },

        getDropdownOptions() : IOption[] {
            if (this.cachedOptions) return this.cachedOptions;
            let arr : IOption[] = [];
            if (!this.options) return arr;
            if (!Array.isArray(this.options)) arr = this.options();
            else arr = this.options;
            this.cachedOptions = arr;
            return arr;
        },
        getDropdownOptionsMap() {
            const ops = this.getDropdownOptions();
            const map: any = {};
            for (const i of ops) {
                map[typeof i.value == 'object' ? i.value.id : i.value] = i;
            }
            return map;
        },

        readonlyValue() {
            if (this.multiple) 
                return this.multiSelectValue();

            return this.selectOption ? (this.selectOption.content ?? this.selectOption.value) : (this.placeholder ?? '');
        },

        multiSelectValue() {
            if (!this.selectedOptions.length) return this.placeholder ?? '';

            return this.selectedOptions.map(item => item.content ?? item.value).join(', ');
        },

        suggestionSelected(arg: IOption) {
            if (!arg) {
                this.selectOption = arg;
                this.$emit('suggestion-selected', arg);
                this.setValue(arg);
                return;
            }
            this.selectOption = arg;
            this.$emit('suggestion-selected', arg.value);
            this.setValue(arg.value);
        },

        onOpenSuggestions() {
            this.passEmit('open', this.modelValue);
            if (!this.suggestions) return;
            this.suggestions(this.modelValue as string, suggestions => {
                this.updateSuggestions(suggestions);
            });
        },

        updateSuggestions(suggestions: any[]) {
            if (!this.suggestions) return;
            this.previousSuggestions = suggestions.map(item => item)
        },

        onCloseSuggestions() {
            this.passEmit('close', this.modelValue)
        },

        footerComponent() {
            const footer: any = this.footer;
            if (!footer) return null;
            if (typeof footer == 'object' && footer.component && footer.props) {
                return footer.components;
            }
            return footer;
        },

        footerProps() {
            const footer: any = this.footer;
            if (!footer) return null;
            if (typeof footer == 'object' && footer.component && footer.props) {
                return footer.props;
            }
            return {};
        }
    }
});