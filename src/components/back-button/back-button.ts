import { Component, Vue, Prop, toNative } from "vue-facing-decorator";

// Back arrow of the screens: a clean chevron with a comfortable touch area. The click is the one of the button (the parent listens to it)
@Component({})
class BackButton extends Vue {

    // Optional text next to the arrow (for the screens that say where they go back to)
    @Prop({ type: String, default: '' })
    label!: string;
}
export default toNative(BackButton);
