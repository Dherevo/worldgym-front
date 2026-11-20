import { Component, Vue, toNative } from "vue-facing-decorator";
import { LANGUAGES, currentLanguage, setLanguage, isDarkTheme, toggleDarkTheme, logout } from "@/modules/preferences";

// Language, light/dark mode and log out. In the app they live in the profile, since it has no side menu
@Component({})
class AppPreferences extends Vue {

    readonly languages = LANGUAGES;
    isDark = isDarkTheme();

    get language(): string {
        return currentLanguage();
    }

    setLanguage(code: string) {
        setLanguage(code);
    }

    toggleTheme() {
        this.isDark = toggleDarkTheme();
    }

    logout() {
        logout().then((done: boolean) => { if (done) this.to('/login'); });
    }
}
export default toNative(AppPreferences);
