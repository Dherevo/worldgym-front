import { Component, Vue, Prop, toNative } from "vue-facing-decorator";

interface Tab { path: string; label: string }

// Top-level tabs of a grouped page. Each tab is a route, so links and reloads keep working.
@Component({})
class TabBar extends Vue {

    @Prop({ type: Array, required: true })
    tabs!: Tab[];

    isActive(path: string): boolean {
        return this.$route.path === path;
    }
}
export default toNative(TabBar);
