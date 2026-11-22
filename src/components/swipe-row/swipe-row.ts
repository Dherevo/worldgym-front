import { Component, Vue, Prop, toNative } from "vue-facing-decorator";

type RowAction = 'share' | 'edit' | 'delete';

// A list row with its actions behind it. With a finger (app, phone) the row slides to the left to show them (plain
// horizontal scroll with snap); with a mouse they are small icon buttons next to the row, always visible.
// The row goes in the slot; the actions are events: share, edit, delete (the ones asked for in `actions`)
@Component({ emits: ['share', 'edit', 'delete'] })
class SwipeRow extends Vue {

    @Prop({ type: Array, default: () => ['edit', 'delete'] })
    actions!: RowAction[];

    // false: the row is shown alone (a list where only some rows have actions)
    @Prop({ type: Boolean, default: true })
    enabled!: boolean;

    has(action: RowAction): boolean {
        return this.actions.includes(action);
    }
}
export default toNative(SwipeRow);
