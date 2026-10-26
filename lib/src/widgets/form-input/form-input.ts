import { defineComponent, PropType } from 'vue';
import IOption from '../../interfaces/IOption';
import TextInput from './inputs/text-input/text-input.vue';
import CheckboxInput from './inputs/checkbox-input/checkbox-input.vue';
import RadioInput from './inputs/radio-input/radio-input.vue';
import ColorInput from './inputs/color-input/color-input.vue';
import PhoneInput from './inputs/phone-input/phone-input.vue';
import TextareaInput from './inputs/textarea-input/textarea-input.vue';
import SwitchInput from './inputs/switch-input/switch-input.vue';
import SelectInput from './inputs/select-input/select-input.vue';
import DateInput from './inputs/date-input/date-input.vue';
import EditorInput from './inputs/editor-input/editor-input.vue';
import FileInput from './inputs/file-input/file-input.vue';
import PasswordInput from './inputs/password-input/password-input.vue';
import SearchInput from './inputs/search-input/search-input.vue';
import Utils from '../../modules/utils'

export default defineComponent({

    components: {
        CheckboxInput,
        RadioInput,
        ColorInput,
        TextInput,
        PhoneInput,
        TextareaInput,
        SwitchInput,
        SelectInput,
        DateInput,
        EditorInput,
        FileInput,
        PasswordInput,
        SearchInput
    },

    props: {

        modelValue: {},

        type: {
            type: String as PropType<
            'text'
            |'email'
            |'number'
            |'checkbox'
            |'radio'
            |'select'
            |'phone'
            |'country'
            |'toggle'
            |'date'
            |'editor'
            |'textarea'
            |'password'
            |'color'
            |'file'
            |'media'
            |'image'
            |'video'
            |'search'>,
            default: 'text'
        },

        pass: {
            type: Object as PropType<any>
        },

        label: {
            type: String
        },
        floatLabel: {
            type: String
        },

        inputId: {
            type: String
        },

        error: {
            type: String
        },

        disabled: {},

        loading: {},

        invalid: {},

        placeholder: {
            type: String
        },

        help: {
            type: String
        },

        stopTime: {
            type: Number,
            default: 300
        },

        readonly: {
            default: false
        },
        required: {
            default: false
        },

        validator: {
            type: Object
        },

        // Text
        mask: {
            type: String
        },

        // Number
        currency: {
            type: String
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
        min: {},
        max: {},

        // Radio
        group: {
            type: String
        },
        value: {
            type: String
        },

        // Dropdown
        options: {
            type: Object as PropType<IOption[]|(() => IOption[])>
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
        multiple: {
            type: Boolean
        },
        footer: {},
        getOptionName: {
            type: Function as PropType<((value: string) => Promise<string>)>
        },

        // Password
        instructions: {
            type: String
        },

        // Date
        dateFormat: {
            type: String,
            default: 'dd/mm/yy'
        },
        returnFormat: {
            type: String,
            default: 'Time'
        },
        range: {
            type: Boolean,
        },
        readonlyFormat: {
            type: String
        },

        // Picker
        accept: {
            type: String
        },
        canDelete: {
            type: Boolean,
            default: true
        },

        // Editor
        toolbar: { },
        clearFormatOnPaste: {
            type: Boolean,
            default: false
        },

        // Phone number
        phoneOptions: {
            type: Object
        },
        number: {
            type: String
        },

        // Suggestions
        suggestions: {
            type: Function as PropType<((query: string, resolve: ((suggestions: IOption[]) => void)) => void)>
        },

        // Image selector
        src: {
            type: String
        },
    },

    emits: [
        'update:modelValue',
        'focus',
        'blur',
        'keyup',
        'keydown',
        'pressEnter',
        'pressTab',
        'tabPressed',
        'pressEsc',
        'close',
        'stop',
        'change',
        'update:prefix',
        'update:country'
    ],

    data: function() {

        const data : {
            inputName: string,
            writeCount: number,
            uniqueId: string,

            selectedFiles: any[],
            cachedOptions?: IOption[],
            localError?: string
        } = {
            inputName: '',
            writeCount: 0,
            uniqueId: Utils.randomString(10),

            selectedFiles: [],
            cachedOptions: undefined,
            localError: undefined
        }
        return data;
    },

    watch: {
        validator() {
            this.setupValidator();
        },
        inputId() {
            if (!this.inputId) return;
            this.uniqueId = this.inputId;
        }
    },

    created() {
        if (this.inputId) {
            this.uniqueId = this.inputId;
        }
        this.setupValidator();
    },

    mounted() {
        const input: any = this.getInput();
        if (input) {
            this.inputName = input.inputName ?? '';
        }
    },

    methods: {

        setupValidator() {
            if (!this.validator) return;
            this.validator.setFormInput(this);
            this.validator.onValidated(this.uniqueId, (valid: boolean, displayErrors: boolean) => {
                const el = this.$refs.formInputContainer as any;
                if (el && displayErrors && !valid) {
                    const rect = el.getBoundingClientRect();
                    const top = rect.top + window.scrollY - 200;
                    window.scrollTo({ top, behavior: 'smooth' });
                }
            });
        },

        getClass() {
            const obj: any = {};
            obj[`type-${this.type}`] = true;
            obj['error'] = !!this.error || !!this.localError;
            if (this.required !== false) {
                obj['required'] = true;
            }
            return obj;
        },

        getLabelContent() {
            if (!this.label) return '';
            let str = this.label;
            if (this.required !== false) {
                str += ' <span class="required">*</span>';
            }
            return str;
        },

        getInput() {
            return this.$refs.inputRef;
        },

        filterProps() {
            const obj: any = {
                ...(this.pass ?? {})
            }

            const allowedProps : string[] = [
                'modelValue',
                'disabled',
                'readonly',
                'type',
                'placeholder'
            ];

            if (this.type == 'text') {
                allowedProps.push(
                    'mask'
                );
            }
            else if (this.type == 'number') {
                allowedProps.push(
                    'decimals',
                    'prefix',
                    'suffix',
                    'currency'
                );
            }
            else if (this.type == 'radio') {
                allowedProps.push(
                    'group',
                    'value'
                );
            }
            else if (this.type == 'date') {
                allowedProps.push(
                    'dateFormat',
                    'selectionMode',
                    'returnFormat',
                    'range',
                    'readonlyFormat'
                );
            }
            else if (this.type == 'editor') {
                allowedProps.push(
                    'toolbar',
                    'clearFormatOnPaste'
                );
            }
            else if (this.type == 'select') {
                allowedProps.push(
                    'options',
                    'comparer',
                    'multiple',
                    'footer',
                    'getOptionName'
                );
            }
            else if (this.type == 'file') {
                allowedProps.push(
                    'accept',
                    'canDelete',
                    'multiple',
                    'src'
                );
            }
            
            if (['search', 'text', 'select'].includes(this.type)) {
                allowedProps.push(
                    'suggestions'
                );
            }

            const p = (this.$props as any);

            Object.keys(p)
            .forEach((k: string) => {
                if (!allowedProps.includes(k)) 
                    return;
                if (p[k] === undefined) 
                    return;

                obj[k] = p[k];
            });

            return obj;
        },

        passEmit(event: any, arg?: any) {
            this.$emit(event, arg);
        },

        setValue($e: any) {
            this.localError = undefined;
            this.$emit('update:modelValue', $e);
            this.$emit('change', $e);
        },

        focus() {
            const input = (this.$refs.inputRef as any);
            try {
                input.focus();
            } catch (e) {
                console.info("FormInput type " + this.type + " does not have focus method", input, e);
            }
        },

        getValidator() {
            return this.validator;
        },

        validate(scrollToElement: boolean = true) {
            const validate = () => {
                if (this.validator) {
                    return this.validator.validate();
                }
                if (!this.required) return true;
                return !!this.modelValue;
            }

            if (!validate()) {

                if (scrollToElement) {
                    const el = this.$refs.formInputContainer as any;
                    if (el) {
                        el.scrollIntoView();
                    }
                }

                return false;
            }
            return true;
        }
    }

})