import { Component, Vue, Prop, Watch, toNative } from "vue-facing-decorator";

interface Tab { path: string; label: string }

// Top-level tabs of a grouped page. Each tab is a route, so links and reloads keep working.
@Component({})
class TabBar extends Vue {

    @Prop({ type: Array, required: true })
    tabs!: Tab[];

    mounted() { this.showActive(); }

    @Watch('$route.path')
    onPath() { this.$nextTick(() => this.showActive()); }

    // The strip scrolls sideways: bring the active tab into view
    showActive() {
        (this.$el as HTMLElement).querySelector<HTMLElement>('.tab-bar-item.active')
            ?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
    }

    isActive(path: string): boolean {
        return this.$route.path === path;
    }
}
export default toNative(TabBar);
