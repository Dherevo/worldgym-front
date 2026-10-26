import { defineComponent, PropType } from 'vue';
import baseInput from '../base-input';
import AutoComplete from 'primevue/autocomplete';
import IOption from '../../../../interfaces/IOption';

export default defineComponent({

    components: { AutoComplete },

    mixins: [baseInput],

    props: {
        modelValue: {
            type: String
        },
        placeholder: {
            type: String
        },
        suggestions: {
            type: Function as PropType<((query: string, resolve: ((suggestions: IOption[]) => void)) => void)>
        }
    },

    emits: [
        'stop',
        'focus',
        'blur',
        'keyup',
        'keydown',
        'update:modelValue',
        'change',
        'close',
        'suggestion-selected',
        'pressEnter'
    ],

    data() {
        const data : {
            selectOption: IOption|null,
            previousSuggestions: any[]
        } = {
            selectOption: null,
            previousSuggestions: []
        }

        return data;
    },

    created() {
        if (this.modelValue) {
            this.selectOption = {
                content: this.modelValue,
                value: this.modelValue
            }
        }
    },

    methods: {

        setValue(value: any) {
            this.$emit('update:modelValue', value);
        },

        updateValue(value: string) {
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

        bindProps() {
            const obj : any = {}

            if (this.inputName) {
                obj['inputId'] = this.inputName;
            }

            return obj;
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
            this.setValue(arg.content);
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

        submit() {
            this.$emit('pressEnter', this.modelValue);
        }
    },
});