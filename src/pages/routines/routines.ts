import { Component, Vue, toNative } from "vue-facing-decorator";
import { http, App } from "lib";

@Component({})
class RoutinesPage extends Vue {

    routines: any[] = [];
    loading = false;
    showForm = false;
    editingRoutine: any = null;
    form = { name: '', description: '', is_global: false };
    saving = false;

    created() {
        this.fetchRoutines();
    }

    fetchRoutines() {
        this.loading = true;
        http.get('/routines')
        .then((res: any) => { this.routines = res.items ?? []; })
        .catch(() => {})
        .finally(() => { this.loading = false; });
    }

    openCreate() {
        this.editingRoutine = null;
        this.form = { name: '', description: '', is_global: false };
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
        .catch(() => App.notification('Error al desar la rutina').setType('error').show())
        .finally(() => { this.saving = false; });
    }

    setDefault(r: any) {
        http.put(`/routines/${r.id}/set-default`)
        .then(() => this.fetchRoutines())
        .catch(() => App.notification('Error al assignar rutina per defecte').setType('error').show());
    }

    deleteRoutine(r: any) {
        App.confirm(`Vols eliminar "${r.name}"?`)
        .then((ok: boolean) => {
            if (!ok) return;
            http.delete(`/routines/${r.id}`)
            .then(() => this.fetchRoutines())
            .catch(() => App.notification('Error al eliminar').setType('error').show());
        });
    }
}
export default toNative(RoutinesPage);
