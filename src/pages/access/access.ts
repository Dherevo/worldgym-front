import { Component, Vue, toNative } from "vue-facing-decorator";
import { http, translate } from "lib";
import userStore from "@/modules/userStore";

type Mode = 'forgot' | 'reset' | 'verify';

// Public screens opened from the e-mails: ask for a reset link, choose a new password, confirm an e-mail
@Component({})
class AccessPage extends Vue {

    email = '';
    password = '';
    repeat = '';
    loading = false;
    done = false;
    error = '';

    get mode(): Mode {
        const path = this.$route.path;
        return path === '/reset-password' ? 'reset' : path === '/verify-email' ? 'verify' : 'forgot';
    }

    get token(): string {
        return new URLSearchParams(window.location.search).get('token') ?? '';
    }

    get loggedIn(): boolean {
        return !!userStore.data;
    }

    created() {
        if (this.mode === 'verify') this.verify();
    }

    // The API answers with a code such as "token.expired"; look for it whatever the body looks like
    private codeIn(e: any): string {
        return JSON.stringify(e?.data ?? {});
    }

    sendLink() {
        if (this.loading || !this.email) return;
        this.loading = true;
        http.post('/auth/password/reset').data({ email: this.email.trim() })
        .then(() => { this.done = true; })
        .catch(() => { this.done = true; }) // same answer whatever happens: do not reveal if the e-mail exists
        .finally(() => { this.loading = false; });
    }

    savePassword() {
        this.error = '';
        if (this.password.length < 8) { this.error = translate.get('access.reset.short'); return; }
        if (this.password !== this.repeat) { this.error = translate.get('access.reset.mismatch'); return; }
        if (this.loading) return;
        this.loading = true;
        http.post('/auth/password/set').data({ token: this.token, password: this.password })
        .then(() => { this.done = true; })
        .catch((e: any) => {
            this.error = this.codeIn(e).includes('expired') ? translate.get('access.reset.expired') : translate.get('access.reset.invalid');
        })
        .finally(() => { this.loading = false; });
    }

    verify() {
        this.loading = true;
        http.post('/auth/verify-email').data({ token: this.token })
        .then(() => { this.done = true; })
        .catch((e: any) => {
            const code = this.codeIn(e);
            this.error = code.includes('expired') ? translate.get('access.verify.expired')
                : code.includes('taken') ? translate.get('access.verify.taken')
                : translate.get('access.verify.invalid');
        })
        .finally(() => { this.loading = false; });
    }
}
export default toNative(AccessPage);
