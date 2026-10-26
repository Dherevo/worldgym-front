<template>
    <AppPage name="workout-detail-page" layout="backoffice">
        <div class="workout-detail-page">

            <div class="page-header">
                <button class="btn-back" @click="to('/workouts')">&larr; Historial</button>
                <div v-if="workout" class="header-info">
                    <div>
                        <h1 class="capitalize">
                            {{ formatDate(workout.date) }}
                            <span class="duration-tag" v-if="formatDuration()">{{ formatDuration() }}</span>
                        </h1>
                        <p class="notes" v-if="workout.notes">{{ workout.notes }}</p>
                    </div>
                    <button class="btn-add-exercise" @click="showExerciseSearch = true">+ Afegir exercici</button>
                </div>
            </div>

            <div v-if="loading" class="loading-text">Carregant...</div>

            <div v-else-if="workout" class="exercises-list">
                <div
                    v-for="(we, i) in workout.workout_exercises"
                    :key="we.id"
                    class="exercise-block"
                    :class="{ dragging: dragFromIdx === i }"
                    draggable="true"
                    @dragstart="dragStart(i)"
                    @dragover.prevent
                    @drop="dropOn(i)"
                    @dragend="dragEnd()"
                >
                    <div class="exercise-header">
                        <div class="drag-handle" title="Arrossega per reordenar">⠿</div>
                        <div>
                            <span class="exercise-name">{{ we.exercise?.name }}</span>
                            <span class="exercise-eq" v-if="we.exercise?.equipment"> · {{ we.exercise.equipment.name }}</span>
                        </div>
                        <div class="exercise-header-right">
                            <span class="volume-tag">Vol: {{ totalVolume(we.sets) }}</span>
                            <button class="btn-delete-exercise" @click="deleteExercise(we)" title="Eliminar exercici">✕</button>
                        </div>
                    </div>

                    <table v-if="we.sets?.length > 0 || addingSetWeId == we.id">
                        <thead>
                            <tr>
                                <th>Set</th>
                                <th>Reps</th>
                                <th>Pes (kg)</th>
                                <th>Descans (s)</th>
                                <th>Notes</th>
                                <th>Flags</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            <template v-for="s in we.sets" :key="s.id">
                                <tr v-if="editingSet?.id !== s.id" :class="{ 'failed-row': s.is_failed }">
                                    <td>{{ s.set_number }}</td>
                                    <td>{{ s.reps }}</td>
                                    <td>{{ s.weight }}</td>
                                    <td>{{ s.rest_seconds ?? '—' }}</td>
                                    <td>{{ s.notes || '—' }}</td>
                                    <td>
                                        <span class="set-badge failed" v-if="s.is_failed">Fallada</span>
                                        <span class="set-badge dropset" v-if="s.is_dropset">Drop</span>
                                    </td>
                                    <td class="row-actions">
                                        <button class="btn-row-edit" @click="openSetEdit(we, s)">✎</button>
                                        <button class="btn-row-delete" @click="deleteSet(we, s)">✕</button>
                                    </td>
                                </tr>
                                <tr v-else class="editing-row">
                                    <td>{{ s.set_number }}</td>
                                    <td><input type="number" v-model.number="editReps" min="1" class="cell-input" /></td>
                                    <td><input type="number" v-model.number="editWeight" min="0" step="0.5" class="cell-input" /></td>
                                    <td><input type="number" v-model.number="editRest" min="0" class="cell-input" /></td>
                                    <td><input type="text" v-model="editSetNotes" class="cell-input wide" /></td>
                                    <td>
                                        <label class="flag-check"><input type="checkbox" v-model="editFailed" /> F</label>
                                        <label class="flag-check"><input type="checkbox" v-model="editDropset" /> D</label>
                                    </td>
                                    <td class="row-actions">
                                        <button class="btn-row-save" @click="saveSetEdit(we)" :disabled="savingSet">✓</button>
                                        <button class="btn-row-cancel" @click="editingSet = null">✕</button>
                                    </td>
                                </tr>
                            </template>
                            <!-- Add set row -->
                            <tr v-if="addingSetWeId == we.id" class="editing-row">
                                <td>{{ (we.sets?.length ?? 0) + 1 }}</td>
                                <td><input type="number" v-model.number="newReps" min="1" class="cell-input" /></td>
                                <td><input type="number" v-model.number="newWeight" min="0" step="0.5" class="cell-input" /></td>
                                <td><input type="number" v-model.number="newRest" min="0" class="cell-input" /></td>
                                <td><input type="text" v-model="newSetNotes" class="cell-input wide" placeholder="Notes" /></td>
                                <td>
                                    <label class="flag-check"><input type="checkbox" v-model="newFailed" /> F</label>
                                    <label class="flag-check"><input type="checkbox" v-model="newDropset" /> D</label>
                                </td>
                                <td class="row-actions">
                                    <button class="btn-row-save" @click="saveNewSet(we)" :disabled="savingSet">✓</button>
                                    <button class="btn-row-cancel" @click="addingSetWeId = null">✕</button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                    <div v-else-if="addingSetWeId != we.id" class="empty-sets">Cap sèrie registrada</div>

                    <button class="btn-add-set" @click="openAddSet(we)">+ Afegir sèrie</button>
                </div>
            </div>

            <!-- Exercise search modal -->
            <div v-if="showExerciseSearch" class="modal-overlay" @click.self="showExerciseSearch = false">
                <div class="modal">
                    <h3>Afegir exercici</h3>
                    <div class="search-wrapper">
                        <input
                            type="text"
                            v-model="exerciseQuery"
                            placeholder="Cerca un exercici..."
                            @input="filterExercises()"
                            autofocus
                        />
                    </div>
                    <div class="exercise-results">
                        <div
                            v-for="ex in filteredExercises"
                            :key="ex.id"
                            class="exercise-result-item"
                            @click="addExercise(ex)"
                        >
                            <span>{{ ex.name }}</span>
                            <small v-if="ex.equipment">{{ ex.equipment.name }}</small>
                        </div>
                        <div v-if="filteredExercises.length === 0 && exerciseQuery" class="no-results">Cap resultat</div>
                    </div>
                    <div class="modal-actions">
                        <button class="btn-cancel" @click="showExerciseSearch = false">Tancar</button>
                    </div>
                </div>
            </div>

        </div>
    </AppPage>
</template>

<script lang="ts" src="./workout-detail.ts"></script>
<style lang="scss" src="./workout-detail.scss"></style>
