import { Component, Vue, Prop, toNative } from "vue-facing-decorator";

// Search box of the app: pill shape, a magnifier inside, a smooth focus and a button to clear the text.
// It works as v-model and also emits `input`, so a parent can react to what is typed as with a plain input
@Component({ emits: ['update:modelValue', 'input'] })
class SearchInput extends Vue {

    @Prop({ type: String, default: '' })
    modelValue!: string;

    @Prop({ type: String, default: '' })
    placeholder!: string;

    @Prop({ type: Boolean, default: false })
    autofocus!: boolean;

    onInput(e: Event) {
        this.send((e.target as HTMLInputElement).value);
    }

    clear() {
        this.send('');
        (this.$refs.field as HTMLInputElement | undefined)?.focus();
    }

    send(value: string) {
        this.$emit('update:modelValue', value);
        this.$emit('input', value);
    }

    mounted() {
        if (this.autofocus) (this.$refs.field as HTMLInputElement | undefined)?.focus();
    }
}
export default toNative(SearchInput);
