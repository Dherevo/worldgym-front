<template>
    <AppPage name="exercises-page" layout="backoffice">
        <div class="exercises-page">

            <div class="page-header">
                <h1>Exercicis</h1>
                <button class="btn-primary" @click="openCreate()">+ Nou exercici</button>
            </div>

            <!-- Tabs -->
            <div class="tabs">
                <button :class="{ active: activeTab === 'all' }" @click="setTab('all')">Tots</button>
                <button :class="{ active: activeTab === 'global' }" @click="setTab('global')">Globals</button>
                <button :class="{ active: activeTab === 'mine' }" @click="setTab('mine')">Els meus</button>
            </div>

            <!-- Filters -->
            <div class="filters">
                <input
                    type="text"
                    v-model="searchQuery"
                    placeholder="Cercar exercici..."
                    @input="onFilterChange()"
                />
                <select v-model="muscleGroupId" @change="onMuscleGroupChange()">
                    <option value="">Tots els grups musculars</option>
                    <option v-for="mg in muscleGroups" :key="mg.id" :value="mg.id">{{ mg.name }}</option>
                </select>
                <select v-model="muscleId" @change="onFilterChange()" :disabled="!muscleGroupId">
                    <option value="">Tots els músculs</option>
                    <option v-for="m in filteredMuscles" :key="m.id" :value="m.id">{{ m.name }}</option>
                </select>
                <label v-if="muscleGroupId || muscleId" class="toggle-secondary">
                    <input type="checkbox" v-model="primaryOnly" @change="onPrimaryOnlyChange()" />
                    Només primaris
                </label>
                <select v-model="equipmentId" @change="onFilterChange()">
                    <option value="">Tot l'equipament</option>
                    <option v-for="eq in equipments" :key="eq.id" :value="eq.id">{{ eq.name }}</option>
                </select>
            </div>

            <!-- List -->
            <div v-if="loading" class="loading-text">Carregant...</div>
            <div v-else-if="exercises.length === 0" class="empty-text">No hi ha exercicis</div>
            <div v-else class="exercise-list">
                <div v-for="ex in exercises" :key="ex.id" class="exercise-card">
                    <div class="exercise-info">
                        <div class="exercise-name">{{ ex.name }}</div>
                        <div class="exercise-meta">
                            <span v-if="ex.is_bodyweight">Pes corporal</span>
                            <span v-else-if="ex.equipment">{{ ex.equipment.name }}</span>
                            <span v-if="ex.muscles?.length"> · {{ primaryMuscles(ex) }}</span>
                            <span class="badge global" v-if="ex.is_global">Global</span>
                            <span class="badge bw" v-if="ex.is_bodyweight">BW</span>
                        </div>
                    </div>
                    <div class="exercise-actions" v-if="!ex.is_global">
                        <button @click="openEdit(ex)">Editar</button>
                        <button class="danger" @click="deleteExercise(ex)">Eliminar</button>
                    </div>
                </div>
            </div>

            <!-- Paginador -->
            <div class="paginator" v-if="!loading && total > pageSize">
                <button @click="prevPage()" :disabled="!hasPrev">&larr;</button>
                <span class="page-info">Pàgina {{ currentPage }} de {{ totalPages }} <small>({{ total }} exercicis)</small></span>
                <button @click="nextPage()" :disabled="!hasNext">&rarr;</button>
            </div>

            <!-- Form Modal -->
            <div v-if="showForm" class="modal-overlay" @click.self="showForm = false">
                <div class="modal">
                    <h2>{{ editingExercise ? 'Editar exercici' : 'Nou exercici' }}</h2>

                    <div class="form-group">
                        <label>Nom *</label>
                        <input type="text" v-model="form.name" placeholder="Nom de l'exercici" />
                    </div>

                    <div class="form-group">
                        <label>Descripció</label>
                        <textarea v-model="form.description" placeholder="Descripció opcional" rows="2"></textarea>
                    </div>

                    <div class="form-group">
                        <label style="display:flex;align-items:center;gap:0.5rem;cursor:pointer">
                            <input type="checkbox" v-model="form.is_bodyweight" style="cursor:pointer" />
                            Exercici de pes corporal (bodyweight)
                        </label>
                    </div>

                    <div class="form-group" v-if="!form.is_bodyweight">
                        <label>Equipament</label>
                        <select v-model="form.equipment_id">
                            <option :value="null">Sense equipament</option>
                            <option v-for="eq in equipments" :key="eq.id" :value="eq.id">{{ eq.name }}</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label>Músculs treballats</label>
                        <div class="muscles-grid">
                            <div v-for="m in muscles" :key="m.id" class="muscle-item">
                                <label class="muscle-check">
                                    <input
                                        type="checkbox"
                                        :checked="isMuscleSelected(m.id)"
                                        @change="toggleMuscle(m.id)"
                                    />
                                    {{ m.name }}
                                    <span class="muscle-group-tag">{{ m.muscle_group?.name }}</span>
                                </label>
                                <select
                                    v-if="isMuscleSelected(m.id)"
                                    :value="getMuscleIsPrimary(m.id)"
                                    @change="setMusclePrimary(m.id, $event.target.value === 'true')"
                                >
                                    <option value="true">Primari</option>
                                    <option value="false">Secundari</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div class="form-actions">
                        <button class="btn-cancel" @click="showForm = false">Cancel·lar</button>
                        <button class="btn-primary" @click="saveExercise()" :disabled="savingExercise">
                            {{ savingExercise ? 'Desant...' : 'Desar' }}
                        </button>
                    </div>
                </div>
            </div>

        </div>
    </AppPage>
</template>

<script lang="ts" src="./exercises.ts"></script>
<style lang="scss" src="./exercises.scss"></style>
