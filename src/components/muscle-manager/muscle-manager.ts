import { Component, Vue, toNative } from "vue-facing-decorator";
import { http, App, translate } from "lib";

interface MuscleForm {
    type: 'group' | 'muscle';
    id: number | null;
    names: Record<string, string>;
    muscle_group_id: number | null;
}

// Admin-only manager of muscle groups and muscles (names are translated per language)
@Component({ emits: ['close', 'changed'] })
class MuscleManager extends Vue {

    readonly locales = ['ca', 'es', 'en'];

    groups: any[] = [];
    muscles: any[] = [];
    loading = false;
    saving = false;
    form: MuscleForm | null = null;

    created() {
        this.fetchAll();
    }

    get formTitle(): string {
        if (!this.form) return '';
        const key = this.form.type === 'group' ? 'Group' : 'Muscle';
        return translate.get(`exercises.manage.${this.form.id ? 'edit' : 'new'}${key}Title`);
    }

    get canSave(): boolean {
        if (!this.form) return false;
        const hasName = this.locales.some(l => this.form!.names[l].trim());
        return hasName && (this.form.type === 'group' || !!this.form.muscle_group_id);
    }

    path(type: 'group' | 'muscle') {
        return type === 'group' ? 'muscle-groups' : 'muscles';
    }

    musclesOf(groupId: number) {
        return this.muscles.filter((m: any) => m.muscle_group?.id === groupId);
    }

    fetchAll() {
        this.loading = true;
        Promise.all([
            http.get('/muscle-groups?pageSize=500').promise(),
            http.get('/muscles?pageSize=500').promise(),
        ])
        .then(([groups, muscles]: any[]) => {
            this.groups = groups.items ?? [];
            this.muscles = muscles.items ?? [];
        })
        .catch(() => {})
        .finally(() => { this.loading = false; });
    }

    openNew(type: 'group' | 'muscle') {
        this.form = { type, id: null, names: { ca: '', es: '', en: '' }, muscle_group_id: this.groups[0]?.id ?? null };
    }

    openEdit(type: 'group' | 'muscle', item: any) {
        this.form = {
            type,
            id: item.id,
            names: { ca: '', es: '', en: '' },
            muscle_group_id: type === 'muscle' ? item.muscle_group?.id ?? null : null,
        };
        // The list only carries the current language: load every stored name
        http.get(`/${this.path(type)}/${item.id}/translations`)
        .then((res: any) => {
            if (!this.form || this.form.id !== item.id) return;
            for (const l of this.locales) this.form.names[l] = res?.[l]?.name ?? '';
        })
        .catch(() => {});
    }

    save() {
        const f = this.form;
        if (!f || !this.canSave) return;
        this.saving = true;

        // The base name is only set on creation (seeds look catalog items up by it);
        // the visible names live in the translations.
        const body: any = {};
        if (!f.id) body.name = this.locales.map(l => f.names[l].trim()).find(Boolean);
        if (f.type === 'muscle') body.muscle_group_id = f.muscle_group_id;

        const path = this.path(f.type);
        const req = f.id
            ? http.put(`/${path}/${f.id}`).data(body).promise()
            : http.post(`/${path}`).data(body).promise();

        req.then((saved: any) => {
            const id = saved?.id ?? f.id;
            return Promise.all(this.locales.map(l =>
                http.put(`/${path}/${id}/translations/${l}`).data({ name: f.names[l] }).promise()
            ));
        })
        .then(() => {
            this.form = null;
            this.fetchAll();
            this.$emit('changed');
        })
        .catch(() => App.notification(translate.get('exercises.manage.errors.save')).setType('error').show())
        .finally(() => { this.saving = false; });
    }

    remove(type: 'group' | 'muscle', item: any) {
        App.confirm(translate.get('exercises.manage.confirmDelete', { name: item.name }))
        .then((ok: boolean) => {
            if (!ok) return;
            http.delete(`/${this.path(type)}/${item.id}`)
            .then(() => {
                this.fetchAll();
                this.$emit('changed');
            })
            .catch(() => App.notification(translate.get('exercises.manage.errors.delete')).setType('error').show());
        });
    }
}
export default toNative(MuscleManager);
