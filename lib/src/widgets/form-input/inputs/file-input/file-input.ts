import { defineComponent } from 'vue';
import baseInput from '../base-input';
import translate from '../../../../modules/translator';
import utils from '../../../../modules/utils';
import VideoPlayer from '../../../video-player/video-player.vue';
import FilePicker from '../../../file-picker/file-picker.vue';

export default defineComponent({

    components: { VideoPlayer, FilePicker },

    mixins: [baseInput],

    props: {
        type: {
            type: String
        },
        accept: {
            type: String
        },
        canDelete: {
            type: Boolean
        },
        label: {
            type: String
        },
        multiple: {
            type: Boolean
        },
        src: {
            type: String
        }
    },

    emits: [
        'update:modelValue',
        'change',
        'remove'
    ],

    data() {
        const data : {
            mediaSrc: any,
            mediaType: 'image'|'video'
        }
        = {
            mediaSrc: null,
            mediaType: 'image',
        }
        return data;
    },

    created() {
        if (this.type == 'image') {
            this.mediaSrc = this.src;
        }
    },

    methods: {
        bindProps() {
            const obj = {
                inputId: this.inputName
            }
             
            return obj;
        },

        updateValue(value: any) {
            this.$emit('update:modelValue', value);
        },

        filePicked(file: File) {
            if (!this.multiple)
                this.updateValue(file);
            else {
                const s = (this.modelValue && Array.isArray(this.modelValue)) ? this.modelValue : [];
                s.push(file);
                this.updateValue(s);
            }
        },

        fileRemoved(file: File) {
            const s = (this.modelValue && Array.isArray(this.modelValue)) ? this.modelValue : [];
            const index = s.indexOf(file);
            if (index > -1)
                s.splice(index, 1);
            this.updateValue(s);
        },

        imagePicked(file: File) {
            this.mediaType = this.getMediaType(file)!;
            this.mediaSrc = utils.fileToURL(file);

            this.updateValue(file);
        },

        getMediaType(file?: File) : 'image'|'video'|undefined {
            const accept = this.accept ? this.accept : '';

            if (this.type == 'image') {
                return 'image';
            } else if (this.type == 'video') {
                return 'video';
            } else {
                if (accept.includes('image')) {
                    if (!accept.includes('video')) {
                        return 'image';
                    }
                } else if (accept.includes('video')) {
                    return 'video';
                }
            }

            if (file) {
                if (utils.isImage(file)) return 'image';
                return 'video';
            }

            return undefined;
        },

        mediaPickerLabel() {

            let str = 'media.select';
            const type = this.getMediaType();

            if (type != undefined) {
                str += utils.capitalize(type);
            }

            return translate.get(str);
        },

        mediaAccept() {
            if (this.accept) {
                return this.accept;
            }

            if (this.type == 'media') return 'image/*,video/*';
            if (this.type == 'video') return 'video/*';
            return '*/*';
        },

        removeFile() {
            this.updateValue(null);
            this.mediaSrc = undefined;
            this.mediaType = 'image';
            this.$emit('remove');
        }
    }
});