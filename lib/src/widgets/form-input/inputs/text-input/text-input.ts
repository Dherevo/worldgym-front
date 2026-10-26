import { defineComponent, PropType } from 'vue';
import InputText from 'primevue/inputtext';
import InputNumber from 'primevue/inputnumber';
import InputMask from 'primevue/inputmask';
import AutoComplete from 'primevue/autocomplete';
import baseInput from '../base-input';
import IOption from '../../../../interfaces/IOption';

export default defineComponent({

    components: { 
        InputText,
        InputMask,
        AutoComplete,
        InputNumber
    },

    mixins: [baseInput],

    props: {
        type: {
            type: String
        },
        mask: {
            type: String
        },
        currency: {
            type: String
        },
        placeholder: {
            type: String
        },
        suggestions: {
            type: Function as PropType<((query: string, resolve: ((suggestions: IOption[]) => void)) => void)>
        },
        decimals: {
            type: Number
        },
        prefix: {
            type: String
        },
        suffix: {
            type: String
        },
        autocomplete: {
            type: String,
            default: 'off'
        },
        name: {
            type: String
        },
        showButtons: {
            default: true,
            type: Boolean
        },
        min: {
            default: 0,
            type: Number
        },
        max: {
            type: Number
        }
    },

    emits: [
        'blur',
        'focus',
        'keyup',
        'keydown',
        'update:modelValue',
        'change',
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
            selectOption: IOption|null,
            previousSuggestions: any[],
            tmpValue: string,
        } = {
            selectOption: null,
            previousSuggestions: [],
            tmpValue: ''
        }
        return data;
    },

    methods: {
        getInput() {
            return (this.$refs.input as any)
        },

        bindProps() {
            const obj : any = {}

            if (this.placeholder) {
                obj['placeholder'] = this.placeholder;
            }

            if (obj['useGrouping'] === undefined) {
                obj['useGrouping'] = false;
            }

            if (this.decimals) {
                obj['minFractionDigits'] = this.decimals;
                obj['maxFractionDigits'] = this.decimals;
            }
    
            if (this.currency) {
                obj['mode'] = 'currency';
                obj['currency'] = this.currency;
            }

            if (this.prefix) {
                obj['prefix'] = this.prefix;
            }
            if (this.suffix) {
                obj['suffix'] = this.suffix;
            }

            if (this.showButtons !== false) {
                obj['showButtons'] = true;
            }

            if (this.min !== undefined) {
                obj['min'] = this.min;
            }
            if (this.max !== undefined) {
                obj['max'] = this.max;
            }
             
            return obj;
        },

        passEmit(event: string, arg?: any) {
            this.$emit(event as any, arg);
        },

        focus() {
            if (!this.$refs.input) return;
            this.getInput().focus();
        },

        blur() {
            if (!this.$refs.input) return;
            this.getInput().blur();
        },

        setValue(value: any) {
            this.$emit('update:modelValue', value);
        },
        
        updateValue(value: any) {
            this.setValue(value);
            this.stopEvent(value);
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
        
        suggestionSelected(arg: any) {
            if (!arg) {
                this.selectOption = arg;
                this.$emit('suggestion-selected', arg);
                this.setValue(arg);
                return;
            }
            this.selectOption = arg;
            this.$emit('suggestion-selected', arg.value);
            this.setValue(arg.content ?? arg.value);
        },

        onOpenSuggestions() {
            this.passEmit('open', this.tmpValue);
            if (!this.suggestions) return;

            this.suggestions(this.tmpValue, suggestions => {
                this.updateSuggestions(suggestions);
            });
        },

        updateSuggestions(suggestions: any[]) {
            if (!this.suggestions) return;
            this.previousSuggestions = suggestions.map(item => item)
        },

        onCloseSuggestions() {
            this.passEmit('close', this.tmpValue)
            if (!this.modelValue) {
                this.tmpValue = "";
            }
        }
    }
});