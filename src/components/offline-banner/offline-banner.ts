import { Component, Vue, Watch, toNative } from "vue-facing-decorator";
import { http, offlineState, translate } from "lib";

// Strip at the top that tells the user the app has no connection, how many changes wait to be sent and when they went out
@Component({})
class OfflineBanner extends Vue {

    state = offlineState;
    notice: 'synced' | 'dropped' | '' = '';
    noticeTimer: any = null;

    get text(): string {
        if (!http.offlineMode) return '';
        if (this.state.syncing) return translate.get('offline.syncing');
        if (this.state.offline && this.state.pending) return `${translate.get('offline.offline')} · ${translate.get('offline.pending', { n: this.state.pending })}`;
        if (this.state.offline) return translate.get('offline.offline');
        if (this.state.pending) return translate.get('offline.pending', { n: this.state.pending });
        if (this.notice) return translate.get('offline.' + this.notice);
        return '';
    }

    get warn(): boolean {
        return this.state.offline || this.notice === 'dropped';
    }

    // When a sending ends, say how it went for a few seconds
    @Watch('state.syncedAt')
    onSynced() {
        this.notice = this.state.dropped ? 'dropped' : 'synced';
        this.state.dropped = 0;
        clearTimeout(this.noticeTimer);
        this.noticeTimer = setTimeout(() => { this.notice = ''; }, 4000);
    }

    beforeUnmount() {
        clearTimeout(this.noticeTimer);
    }
}
export default toNative(OfflineBanner);
