import { Component, Vue, toNative } from "vue-facing-decorator";
import { translate } from "lib";
import auth from "@/modules/auth";

@Component({})
class LoginPage extends Vue {

    username = '';
    password = '';
    showPassword = false;
    loading = false;
    error = '';

    submit() {
        if (this.loading) return;
        this.loading = true;
        this.error = '';
        auth.login(this.username, this.password)
        .then(() => auth.fetchUserData())
        .then(() => {
            this.to('/');
        })
        .catch(() => {
            this.error = translate.get('login.invalidCredentials');
        })
        .finally(() => { this.loading = false; });
    }
}
export default toNative(LoginPage);
