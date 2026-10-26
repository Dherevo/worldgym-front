import { Component, Vue, toNative } from "vue-facing-decorator";
import { LoginPageV2 as Login } from "lib";
import auth from "@/modules/auth";

@Component({
    components: {Login}
})
class LoginPage extends Vue {

    doLogin($e: {
        username: string,
        password: string,
        success: () => void,
        error: (error: string) => void
    }) {
        auth.login($e.username, $e.password)
        .then(() => auth.fetchUserData())
        .then(() => {
            this.to('/');
            $e.success();
        })
        .catch(() => {
            $e.error('Credencials incorrectes')
        })
    }
}
export default toNative(LoginPage);
