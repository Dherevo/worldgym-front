<template>
    <AppPage name="workouts-page" layout="backoffice">
        <div class="workouts-page">

            <div class="page-header">
                <h1>Historial d'entrenaments</h1>
                <button class="btn-new" @click="openCreate()">+ Nou entrenament</button>
            </div>

            <div class="filters">
                <div class="filter-group">
                    <label>Des de</label>
                    <input type="date" v-model="dateFrom" @change="fetchWorkouts()" />
                </div>
                <div class="filter-group">
                    <label>Fins a</label>
                    <input type="date" v-model="dateTo" @change="fetchWorkouts()" />
                </div>
                <button class="btn-clear" @click="dateFrom = ''; dateTo = ''; fetchWorkouts()">Netejar</button>
            </div>

            <div v-if="loading" class="loading-text">Carregant...</div>
            <div v-else-if="workouts.length === 0" class="empty-text">Cap entrenament trobat</div>
            <div v-else class="workout-list">
                <div
                    v-for="w in workouts"
                    :key="w.id"
                    class="workout-card"
                    @click="to('/workouts/' + w.id)"
                >
                    <div class="workout-info">
                        <div class="workout-date">
                            {{ formatDate(w.date) }}
                            <span class="duration-badge" v-if="formatDuration(w)">{{ formatDuration(w) }}</span>
                            <span class="status-badge active" v-if="w.status === 'active'">En curs</span>
                        </div>
                        <div class="workout-notes">{{ w.notes || 'Sense notes' }}</div>
                    </div>
                    <button class="btn-edit" @click.stop="openEdit(w)" title="Editar">✎</button>
                    <button class="btn-delete" @click.stop="deleteWorkout(w)" title="Eliminar">✕</button>
                    <div class="workout-arrow">&rsaquo;</div>
                </div>
            </div>

        <!-- Create / Edit modal -->
        <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
            <div class="modal">
                <h3>{{ editingWorkout ? 'Editar entrenament' : 'Nou entrenament' }}</h3>
                <div class="form-group">
                    <label>Data</label>
                    <input type="date" v-model="editDate" />
                </div>
                <div class="form-group">
                    <label>Notes</label>
                    <input type="text" v-model="editNotes" placeholder="Sense notes" />
                </div>
                <div class="modal-actions">
                    <button class="btn-cancel" @click="showModal = false">Cancel·lar</button>
                    <button class="btn-save" @click="editingWorkout ? saveEdit() : saveCreate()" :disabled="saving">
                        {{ saving ? 'Desant...' : 'Desar' }}
                    </button>
                </div>
            </div>
        </div>

        </div>
    </AppPage>
</template>

<script lang="ts" src="./workouts.ts"></script>
<style lang="scss" src="./workouts.scss"></style>
