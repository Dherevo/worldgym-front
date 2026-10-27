import { Component, Vue, toNative } from "vue-facing-decorator";
import { http, App, translate } from "lib";
import userStore from "@/modules/userStore";
import MuscleManager from "@/components/muscle-manager/muscle-manager.vue";

@Component({ components: { MuscleManager } })
class ExercisesPage extends Vue {

    showMuscleManager = false;

    exercises: any[] = [];
    loading = false;
    activeTab: 'all' | 'global' | 'mine' = 'all';
    searchQuery = '';
    muscleGroupId = '';
    muscleId = '';
    primaryOnly = true;
    equipmentId = '';
    muscleGroups: any[] = [];
    muscles: any[] = [];
    equipments: any[] = [];

    get filteredMuscles() {
        if (!this.muscleGroupId) return this.muscles;
        return this.muscles.filter((m: any) => m.muscle_group?.id == this.muscleGroupId);
    }

    // Paginació
    offset = 0;
    pageSize = 10;
    total = 0;

    detailExercise: any = null;

    showForm = false;
    editingExercise: any = null;
    form: any = {
        name: '',
        description: '',
        equipment_id: null,
        is_global: false,
        is_bodyweight: false,
        muscles: []
    };
    savingExercise = false;

    readonly locales = ['ca', 'es', 'en'];
    texts: any = this.emptyTexts();
    gifFile: File | null = null;
    gifPreview = '';
    removeGif = false;

    get isAdmin(): boolean {
        return !!userStore.data?.isAdmin;
    }

    canEdit(ex: any): boolean {
        return !ex.is_global || this.isAdmin;
    }

    emptyTexts() {
        return { ca: { name: '', description: '' }, es: { name: '', description: '' }, en: { name: '', description: '' } };
    }

    get currentPage() { return Math.floor(this.offset / this.pageSize) + 1; }
    get totalPages() { return Math.ceil(this.total / this.pageSize) || 1; }
    get hasPrev() { return this.offset > 0; }
    get hasNext() { return this.offset + this.pageSize < this.total; }

    created() {
        this.fetchFilters();
        this.fetchExercises();
    }

    fetchFilters() {
        http.get('/muscle-groups?pageSize=500').then((res: any) => { this.muscleGroups = res.items ?? []; }).catch(() => {});
        http.get('/equipment?pageSize=500').then((res: any) => { this.equipments = res.items ?? []; }).catch(() => {});
        http.get('/muscles?pageSize=500').then((res: any) => { this.muscles = res.items ?? []; }).catch(() => {});
    }

    onMuscleGroupChange() {
        this.muscleId = '';
        this.offset = 0;
        this.fetchExercises();
    }

    onPrimaryOnlyChange() {
        this.offset = 0;
        this.fetchExercises();
    }

    fetchExercises() {
        this.loading = true;
        const params: any = { offset: this.offset };
        if (this.searchQuery) params.search = this.searchQuery;
        if (this.activeTab === 'global') params.only_global = true;
        if (this.activeTab === 'mine') params.only_mine = true;
        if (this.muscleId) {
            params.muscle_id = this.muscleId;
            if (this.primaryOnly) params.primary_only = true;
        } else if (this.muscleGroupId) {
            params.muscle_group_id = this.muscleGroupId;
            if (this.primaryOnly) params.primary_only = true;
        }
        if (this.equipmentId) params.equipment_id = this.equipmentId;

        http.get('/exercises').data(params)
        .then((res: any) => {
            this.exercises = res.items ?? [];
            this.total = res.total ?? 0;
            this.pageSize = res.pageSize ?? 10;
        })
        .catch(() => {})
        .finally(() => { this.loading = false; });
    }

    setTab(tab: 'all' | 'global' | 'mine') {
        this.activeTab = tab;
        this.offset = 0;
        this.fetchExercises();
    }

    prevPage() {
        if (!this.hasPrev) return;
        this.offset = Math.max(0, this.offset - this.pageSize);
        this.fetchExercises();
    }

    nextPage() {
        if (!this.hasNext) return;
        this.offset += this.pageSize;
        this.fetchExercises();
    }

    onFilterChange() {
        this.offset = 0;
        this.fetchExercises();
    }

    openDetail(ex: any) {
        this.detailExercise = ex;
    }

    resetMedia(currentGif: string | null) {
        this.gifFile = null;
        this.gifPreview = currentGif ?? '';
        this.removeGif = false;
    }

    openCreate() {
        this.editingExercise = null;
        this.form = { name: '', description: '', equipment_id: null, is_global: false, is_bodyweight: false, muscles: [] };
        this.texts = this.emptyTexts();
        this.resetMedia(null);
        this.showForm = true;
    }

    openEdit(ex: any) {
        this.editingExercise = ex;
        this.form = {
            name: ex.name,
            description: ex.description || '',
            equipment_id: ex.equipment?.id || null,
            is_global: ex.is_global,
            is_bodyweight: ex.is_bodyweight ?? false,
            muscles: ex.muscles?.map((m: any) => ({ muscle_id: m.id, is_primary: !!m.pivot?.is_primary })) || []
        };
        this.texts = this.emptyTexts();
        this.resetMedia(ex.gif_url);
        this.showForm = true;

        // Stored texts per language (the list only carries the one of the current language)
        http.get(`/exercises/${ex.id}/translations`)
        .then((res: any) => {
            for (const l of this.locales) {
                this.texts[l].name = res?.[l]?.name ?? '';
                this.texts[l].description = res?.[l]?.description ?? '';
            }
        })
        .catch(() => {});
    }

    onGifPicked(e: Event) {
        const file = (e.target as HTMLInputElement).files?.[0] ?? null;
        this.gifFile = file;
        this.removeGif = false;
        if (file) this.gifPreview = URL.createObjectURL(file);
    }

    clearGif() {
        this.gifFile = null;
        this.gifPreview = '';
        this.removeGif = true;
    }

    // Base name of a new exercise: the first language that has one
    get hasName(): boolean {
        return this.locales.some((l: string) => this.texts[l].name.trim());
    }

    isMuscleSelected(muscleId: number) {
        return this.form.muscles.some((m: any) => m.muscle_id === muscleId);
    }

    getMuscleIsPrimary(muscleId: number) {
        const m = this.form.muscles.find((m: any) => m.muscle_id === muscleId);
        return m?.is_primary ?? true;
    }

    toggleMuscle(muscleId: number) {
        const idx = this.form.muscles.findIndex((m: any) => m.muscle_id === muscleId);
        if (idx >= 0) {
            this.form.muscles.splice(idx, 1);
        } else {
            this.form.muscles.push({ muscle_id: muscleId, is_primary: true });
        }
    }

    setMusclePrimary(muscleId: number, isPrimary: boolean) {
        const m = this.form.muscles.find((m: any) => m.muscle_id === muscleId);
        if (m) m.is_primary = isPrimary;
    }

    saveExercise() {
        if (!this.hasName) return;
        this.savingExercise = true;

        // Names and descriptions live in the translations: the base name is only set on creation,
        // because it is what the seeds and sync-media use to find global exercises.
        const first = (field: string) => this.locales.map((l: string) => this.texts[l][field].trim()).find(Boolean) ?? null;
        const body: any = {
            equipment_id: this.form.is_bodyweight ? null : this.form.equipment_id,
            muscles: this.form.muscles,
        };
        if (!this.editingExercise) {
            body.name = first('name');
            body.description = first('description');
            body.is_global = this.isAdmin && this.form.is_global;
        } else if (this.isAdmin && this.form.is_global && !this.editingExercise.is_global) {
            // Promote an own exercise to global (one-way)
            body.is_global = true;
        }

        const save = this.editingExercise
            ? http.put(`/exercises/${this.editingExercise.id}`).data(body).promise()
            : http.post('/exercises').data(body).promise();

        save.then((saved: any) => {
            const id = saved?.id ?? this.editingExercise?.id;
            return Promise.all(this.locales.map((l: string) =>
                http.put(`/exercises/${id}/translations/${l}`).data({
                    name: this.texts[l].name,
                    description: this.texts[l].description,
                }).promise()
            )).then(() => this.saveMedia(id));
        })
        .then(() => {
            this.showForm = false;
            this.fetchExercises();
        })
        .catch(() => App.notification(translate.get('exercises.errors.save')).setType('error').show())
        .finally(() => { this.savingExercise = false; });
    }

    saveMedia(id: number) {
        if (this.gifFile) {
            return http.post(`/exercises/${id}/gif`).setDataFormat('formData').data({ gif: this.gifFile }).promise();
        }
        if (this.removeGif && this.editingExercise?.gif_url) {
            return http.delete(`/exercises/${id}/gif`).promise();
        }
        return Promise.resolve();
    }

    deleteExercise(ex: any) {
        App.confirm(translate.get('exercises.confirmDelete', { name: ex.name }))
        .then((ok: boolean) => {
            if (!ok) return;
            http.delete(`/exercises/${ex.id}`)
            .then(() => this.fetchExercises())
            .catch(() => App.notification(translate.get('exercises.errors.delete')).setType('error').show());
        });
    }

    primaryMuscles(ex: any) {
        return ex.muscles?.filter((m: any) => m.pivot?.is_primary).map((m: any) => m.name).join(', ') || '—';
    }
}
export default toNative(ExercisesPage);
