import { defineComponent } from 'vue';
import Quill from 'quill';
import "quill/dist/quill.core.css";
import "quill/dist/quill.snow.css";
import baseInput from '../base-input';

export default defineComponent({

    mixins: [baseInput],

    props: {
        toolbar: {},
        clearFormatOnPaste: {
            type: Boolean,
            default: true
        }
    },

    emits: [
        'update:modelValue',
        'change',
        'stop'
    ],

    mounted() {
        this.setup();
    },

    methods: {

        setup() {
            const container = this.$refs.container as any;
            if (!container) return;

            const already = container.querySelector('.ql-toolbar');
            if (already) {
                already.remove();
            }

            if (!this.$refs.editor) return;
            const e = this.$refs.editor as HTMLElement;
            const quill = new Quill(e, {
                theme: 'snow',
                modules: {
                    toolbar: this.getToolbar()
                }
            });
            quill.on('text-change', () => {
                this.updateValue(quill.getSemanticHTML());
            });
            if (this.clearFormatOnPaste) {
                quill.clipboard.addMatcher(Node.ELEMENT_NODE, function(_, delta) {
                    delta.ops.forEach(op => {
                    if (op.attributes) {
                        delete op.attributes;
                    }
                    });
                    return delta;
                });
            }
            quill.setContents(quill.clipboard.convert({html: this.modelValue as string}));
        },

        updateValue(value: any) {
            this.$emit('update:modelValue', value);
            this.stopEvent(value);
        },

        stopEvent(value?: any) {
            this.writeCount += 1;
            const currentWriteCount = this.writeCount;
            setTimeout(() => {
                if (currentWriteCount == this.writeCount) {
                    this.$emit('stop', value);
                }
            }, this.stopTime);
        },
        
        bindProps() {
    
            const obj = {
                inputId: this.inputName
            }
             
            return obj;
        },

        getToolbar() {

            if (!this.toolbar || this.toolbar == 'basic') {
                return [
                    ['bold', 'italic', 'underline', 'strike'],
                    [{ 'list': 'bullet' }],
                    [{ 'align': [] }]
                  ];
            }
            else if (this.toolbar == 'medium') {
                return [
                    [{ 'size': [] }],
                    ['bold', 'italic', 'underline', 'strike'],
                    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                    [{ 'align': [] }],
                    ['code-block']
                  ];
            }
            else if (this.toolbar == 'advanced') {
                return [
                    [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
                    [{ 'size': [] }],
                    ['bold', 'italic', 'underline', 'strike'],
                    [{ 'color': [] }, { 'background': [] }],
                    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                    [{ 'indent': '-1'}, { 'indent': '+1' }],
                    [{ 'direction': 'rtl' }],
                    [{ 'align': [] }],
                    [{ 'script': 'sub' }, { 'script': 'super' }],
                    ['blockquote', 'code-block'],
                    ['link', 'image', 'video'],
                    ['clean']
                  ];
            }

            return this.toolbar;
        },
    }
});