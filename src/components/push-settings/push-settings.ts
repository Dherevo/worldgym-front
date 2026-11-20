import { Component, Vue, toNative } from "vue-facing-decorator";
import { http, App, translate } from "lib";
import userStore from "@/modules/userStore";

// Reminders of the profile (app only): what the user wants to be told about, quiet hours and a test button
@Component({})
class PushSettings extends Vue {

    settings: any = null;
    testing = false;

    readonly types = ['workout', 'meals', 'weigh', 'steps', 'habits', 'challenges', 'weekly', 'cycle'];

    // The cycle forecast is only offered to users who set their gender to female
    get visibleTypes(): string[] {
        return this.types.filter(t => t !== 'cycle' || userStore.data?.gender === 'female');
    }

    created() {
        http.get('/push/settings')
        .then((res: any) => { this.settings = res; })
        .catch(() => {});
    }

    // The change shows at once; if the server cannot keep it, it goes back
    save(patch: Record<string, any>) {
        const before = { ...this.settings };
        this.settings = { ...this.settings, ...patch };

        http.put('/push/settings').data(patch)
        .then((res: any) => { this.settings = res; })
        .catch(() => {
            this.settings = before;
            App.notification(translate.get('push.saveError')).setType('error').show();
        });
    }

    toggle(key: string) {
        this.save({ [key]: !this.settings[key] });
    }

    setQuiet(key: 'quiet_from' | 'quiet_to', e: Event) {
        const value = (e.target as HTMLInputElement).value;
        if (value) this.save({ [key]: value });
    }

    sendTest() {
        if (this.testing) return;
        this.testing = true;
        http.post('/push/test').data({})
        .then((res: any) => {
            const ok = res?.sent > 0;
            App.notification(translate.get(ok ? 'push.testSent' : 'push.testFailed')).setType(ok ? 'success' : 'error').show();
        })
        .catch(() => App.notification(translate.get('push.testFailed')).setType('error').show())
        .finally(() => { this.testing = false; });
    }
}
export default toNative(PushSettings);
