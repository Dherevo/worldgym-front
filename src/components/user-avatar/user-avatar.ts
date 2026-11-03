import { Component, Vue, Prop, toNative } from "vue-facing-decorator";

// Profile photo, or the first letter of the username when there is none
@Component({})
class UserAvatar extends Vue {

    @Prop({ type: String, default: null })
    url!: string | null;

    @Prop({ type: String, default: '' })
    name!: string;

    @Prop({ type: Number, default: 38 })
    size!: number;

    get initial(): string {
        return (this.name || '?').trim().charAt(0).toUpperCase() || '?';
    }
}
export default toNative(UserAvatar);
