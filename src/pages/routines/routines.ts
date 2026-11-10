import { Component, Vue, toNative } from "vue-facing-decorator";
import { http, App, translate } from "lib";

@Component({})
class RoutinesPage extends Vue {

    routines: any[] = [];
    templates: any[] = [];
    cloningId: number | null = null;
    loading = false;
    showForm = false;
    editingRoutine: any = null;
    form = { name: '', description: '' };
    saving = false;

    created() {
        this.fetchRoutines();
    }

    // Global routines (templates) are managed from the backoffice
    canEdit(r: any): boolean {
        return !r.is_global;
    }

    fetchRoutines() {
        this.loading = true;
        http.get('/routines?only_mine=true')
        .then((res: any) => { this.routines = res.items ?? []; })
        .catch(() => {})
        .finally(() => { this.loading = false; });
    }

    openCreate() {
        this.editingRoutine = null;
        this.form = { name: '', description: '' };
        this.showForm = true;
        http.get('/routines?only_global=true')
        .then((res: any) => { this.templates = res.items ?? []; })
        .catch(() => { this.templates = []; });
    }

    openEdit(r: any) {
        this.editingRoutine = r;
        this.form = { name: r.name, description: r.description || '' };
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
            this.showForm = false;
            App.notification(translate.get('routines.cloned', { name: r.name })).setType('success').show();
            return App.confirm(translate.get('routines.askDefault', { name: created.name }))
            .then((ok: boolean) => ok
                ? http.put(`/routines/${created.id}/set-default`).data({ active: true }).catch(() => {
                    App.notification(translate.get('routines.errors.setDefault')).setType('error').show();
                })
                : null)
            .then(() => this.to('/routines/' + created.id));
        })
        .catch(() => App.notification(translate.get('routines.errors.clone')).setType('error').show())
        .finally(() => { this.cloningId = null; });
    }

    // Several routines can be active at once (e.g. gym + flexibility): this only switches this one
    toggleActive(r: any) {
        http.put(`/routines/${r.id}/set-default`).data({ active: !r.is_default })
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
