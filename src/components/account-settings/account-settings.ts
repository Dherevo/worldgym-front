import { Component, Vue, toNative } from "vue-facing-decorator";
import { http, App, translate } from "lib";
import auth from "@/modules/auth";
import userStore from "@/modules/userStore";

// Account section of the profile: name and username, e-mail (confirmed through a link) and password
@Component({})
class AccountSettings extends Vue {

    name = '';
    nickname = '';
    savingDetails = false;
    detailsError = '';
    detailsOk = false;

    newEmail = '';
    emailPassword = '';
    savingEmail = false;
    resending = false;
    emailError = '';
    emailOk = '';

    currentPassword = '';
    newPassword = '';
    repeatPassword = '';
    savingPassword = false;
    passwordError = '';
    passwordOk = false;

    get user(): any {
        return userStore.data;
    }

    created() {
        this.name = this.user?.name ?? '';
        this.nickname = this.user?.nickname ?? '';
        // The profile may be opened before the user data has arrived
        if (!this.user) {
            auth.fetchUserData().then(() => { this.name = this.user?.name ?? ''; this.nickname = this.user?.nickname ?? ''; });
        }
    }

    // The API answers with a code such as "email.taken": look for it whatever the body looks like
    private has(e: any, code: string): boolean {
        return JSON.stringify(e?.data ?? {}).includes(code);
    }

    saveDetails() {
        if (this.savingDetails) return;
        this.savingDetails = true;
        this.detailsError = '';
        this.detailsOk = false;
        http.put('/account/details').data({ name: this.name, nickname: this.nickname })
        .then(() => auth.fetchUserData())
        .then(() => { this.detailsOk = true; })
        .catch((e: any) => {
            this.detailsError = this.has(e, 'nickname.taken') ? translate.get('account.details.errTaken')
                : this.has(e, 'nickname.invalid') ? translate.get('account.details.errNickname')
                : this.has(e, 'name.invalid') ? translate.get('account.details.errName')
                : translate.get('account.error');
        })
        .finally(() => { this.savingDetails = false; });
    }

    saveEmail() {
        if (this.savingEmail) return;
        this.savingEmail = true;
        this.emailError = '';
        this.emailOk = '';
        const email = this.newEmail.trim();
        http.put('/account/email').data({ email, password: this.emailPassword })
        .then(() => auth.fetchUserData())
        .then(() => {
            this.emailOk = translate.get('account.email.changed', { email });
            this.newEmail = '';
            this.emailPassword = '';
        })
        .catch((e: any) => {
            this.emailError = this.has(e, 'password.current_invalid') ? translate.get('account.email.errPassword')
                : this.has(e, 'email.taken') ? translate.get('account.email.errTaken')
                : this.has(e, 'email.same') ? translate.get('account.email.errSame')
                : this.has(e, 'email.invalid') ? translate.get('account.email.errInvalid')
                : this.has(e, 'email.send_failed') ? translate.get('account.email.errSend')
                : translate.get('account.error');
        })
        .finally(() => { this.savingEmail = false; });
    }

    resend() {
        if (this.resending) return;
        this.resending = true;
        http.post('/account/verify-email/resend').data({})
        .then(() => App.notification(translate.get('account.email.resent')).setType('success').show())
        .catch(() => App.notification(translate.get('account.email.errSend')).setType('error').show())
        .finally(() => { this.resending = false; });
    }

    savePassword() {
        this.passwordError = '';
        this.passwordOk = false;
        if (this.newPassword.length < 8) { this.passwordError = translate.get('account.password.short'); return; }
        if (this.newPassword !== this.repeatPassword) { this.passwordError = translate.get('account.password.mismatch'); return; }
        if (this.savingPassword) return;
        this.savingPassword = true;
        http.put('/auth/password').data({ current_password: this.currentPassword, password: this.newPassword })
        .then(() => {
            this.passwordOk = true;
            this.currentPassword = '';
            this.newPassword = '';
            this.repeatPassword = '';
        })
        .catch((e: any) => {
            this.passwordError = this.has(e, 'current_invalid') ? translate.get('account.password.errCurrent') : translate.get('account.error');
        })
        .finally(() => { this.savingPassword = false; });
    }
}
export default toNative(AccountSettings);
