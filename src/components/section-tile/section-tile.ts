import { Component, Vue, Prop, toNative } from "vue-facing-decorator";

// Compact row (title + short status) that opens its content in a modal. With `inline` it only renders the content.
@Component({ emits: ['update:open'] })
class SectionTile extends Vue {

    @Prop({ type: String, default: '' })
    title!: string;

    @Prop({ type: String, default: '' })
    status!: string;

    // done | pending
    @Prop({ type: String, default: '' })
    tone!: string;

    @Prop({ type: Boolean, default: false })
    open!: boolean;

    @Prop({ type: Boolean, default: false })
    inline!: boolean;
}
export default toNative(SectionTile);
