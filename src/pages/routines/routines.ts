import { Component, Vue, toNative } from "vue-facing-decorator";
import { http, App, translate } from "lib";
import userStore from "@/modules/userStore";

@Component({})
class RoutinesPage extends Vue {

    routines: any[] = [];
    activeTab: 'mine' | 'templates' = 'mine';
    cloningId: number | null = null;
    loading = false;
    showForm = false;
    editingRoutine: any = null;
    form = { name: '', description: '', is_global: false };
    saving = false;

    created() {
        this.fetchRoutines();
    }

    get isAdmin(): boolean {
        return !!userStore.data?.isAdmin;
    }

    // Global routines are read-only for regular users
    canEdit(r: any): boolean {
        return !r.is_global || this.isAdmin;
    }

    setTab(tab: 'mine' | 'templates') {
        if (tab === this.activeTab) return;
        this.activeTab = tab;
        this.fetchRoutines();
    }

    fetchRoutines() {
        this.loading = true;
        const filter = this.activeTab === 'templates' ? 'only_global=true' : 'only_mine=true';
        http.get(`/routines?${filter}`)
        .then((res: any) => { this.routines = res.items ?? []; })
        .catch(() => {})
        .finally(() => { this.loading = false; });
    }

    openCreate() {
        this.editingRoutine = null;
        this.form = { name: '', description: '', is_global: this.activeTab === 'templates' };
        this.showForm = true;
    }

    openEdit(r: any) {
        this.editingRoutine = r;
        this.form = { name: r.name, description: r.description || '', is_global: r.is_global };
        this.showForm = true;
    }

    save() {
        if (!this.form.name.trim()) return;
        this.saving = true;
        const req = this.editingRoutine
            ? http.put(`/routines/${this.editingRoutine.id}`).data(this.form)
            : http.post('/routines').data(this.form);

        req.then(() => {
            this.showForm = false;
            this.fetchRoutines();
        })
        .catch(() => App.notification(translate.get('routines.errors.save')).setType('error').show())
        .finally(() => { this.saving = false; });
    }

    cloneRoutine(r: any) {
        this.cloningId = r.id;
        http.post(`/routines/${r.id}/clone`).data({})
        .then((created: any) => {
            App.notification(translate.get('routines.cloned', { name: r.name })).setType('success').show();
            return App.confirm(translate.get('routines.askDefault', { name: created.name }))
            .then((ok: boolean) => ok
                ? http.put(`/routines/${created.id}/set-default`).catch(() => {
                    App.notification(translate.get('routines.errors.setDefault')).setType('error').show();
                })
                : null)
            .then(() => this.to('/routines/' + created.id));
        })
        .catch(() => App.notification(translate.get('routines.errors.clone')).setType('error').show())
        .finally(() => { this.cloningId = null; });
    }

    setDefault(r: any) {
        http.put(`/routines/${r.id}/set-default`)
        .then(() => this.fetchRoutines())
        .catch(() => App.notification(translate.get('routines.errors.setDefault')).setType('error').show());
    }

    deleteRoutine(r: any) {
        App.confirm(translate.get('routines.confirmDelete', { name: r.name }))
        .then((ok: boolean) => {
            if (!ok) return;
            http.delete(`/routines/${r.id}`)
            .then(() => this.fetchRoutines())
            .catch(() => App.notification(translate.get('routines.errors.delete')).setType('error').show());
        });
    }
}
export default toNative(RoutinesPage);
