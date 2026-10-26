import { Component, Vue, toNative } from "vue-facing-decorator";
import { http, App } from "lib";

@Component({})
class ExercisesPage extends Vue {

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

    get currentPage() { return Math.floor(this.offset / this.pageSize) + 1; }
    get totalPages() { return Math.ceil(this.total / this.pageSize) || 1; }
    get hasPrev() { return this.offset > 0; }
    get hasNext() { return this.offset + this.pageSize < this.total; }

    created() {
        this.fetchFilters();
        this.fetchExercises();
    }

    fetchFilters() {
        http.get('/muscle-groups').then((res: any) => { this.muscleGroups = res.items ?? []; }).catch(() => {});
        http.get('/equipment').then((res: any) => { this.equipments = res.items ?? []; }).catch(() => {});
        http.get('/muscles').then((res: any) => { this.muscles = res.items ?? []; }).catch(() => {});
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

    openCreate() {
        this.editingExercise = null;
        this.form = { name: '', description: '', equipment_id: null, is_global: false, is_bodyweight: false, muscles: [] };
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
        this.showForm = true;
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
        if (!this.form.name.trim()) return;
        this.savingExercise = true;
        const body = { ...this.form };
        const req = this.editingExercise
            ? http.put(`/exercises/${this.editingExercise.id}`).data(body)
            : http.post('/exercises').data(body);

        req.then(() => {
            this.showForm = false;
            this.fetchExercises();
        })
        .catch(() => App.notification('Error al desar l\'exercici').setType('error').show())
        .finally(() => { this.savingExercise = false; });
    }

    deleteExercise(ex: any) {
        App.confirm(`Vols eliminar "${ex.name}"?`)
        .then((ok: boolean) => {
            if (!ok) return;
            http.delete(`/exercises/${ex.id}`)
            .then(() => this.fetchExercises())
            .catch(() => App.notification('Error al eliminar').setType('error').show());
        });
    }

    primaryMuscles(ex: any) {
        return ex.muscles?.filter((m: any) => m.pivot?.is_primary).map((m: any) => m.name).join(', ') || '—';
    }
}
export default toNative(ExercisesPage);
