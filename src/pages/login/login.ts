import { Component, Vue, toNative } from "vue-facing-decorator";
import { translate } from "lib";
import auth from "@/modules/auth";
import userStore from "@/modules/userStore";

@Component({})
class LoginPage extends Vue {

    username = '';
    password = '';
    showPassword = false;
    loading = false;
    error = '';

    created() {
        // The session expired and could not be renewed: tell the user instead of failing silently
        try {
            if (sessionStorage.getItem('sessionExpired')) {
                sessionStorage.removeItem('sessionExpired');
                this.error = translate.get('login.sessionExpired');
            }
        } catch { /* storage unavailable */ }
    }

    submit() {
        if (this.loading) return;
        this.loading = true;
        this.error = '';
        auth.login(this.username, this.password)
        .then(() => auth.fetchUserData())
        .then(() => {
            this.to(auth.needsProfile(userStore.data) ? '/onboarding' : '/');
        })
        .catch(() => {
            this.error = translate.get('login.invalidCredentials');
        })
        .finally(() => { this.loading = false; });
    }
}
export default toNative(LoginPage);
