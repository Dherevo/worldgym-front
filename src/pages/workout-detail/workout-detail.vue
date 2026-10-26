<template>
    <AppPage name="workout-detail-page" layout="backoffice">
        <div class="workout-detail-page">

            <div class="page-header">
                <button class="btn-back" @click="to('/workouts')">&larr; {{ $t('workoutDetail.back') }}</button>
                <div v-if="workout" class="header-info">
                    <div>
                        <h1 class="capitalize">
                            {{ formatDate(workout.date) }}
                            <span class="duration-tag" v-if="formatDuration()">{{ formatDuration() }}</span>
                        </h1>
                        <p class="notes" v-if="workout.notes">{{ workout.notes }}</p>
                    </div>
                    <button class="btn-add-exercise" @click="showExerciseSearch = true">{{ $t('workoutDetail.addExercise') }}</button>
                </div>
            </div>

            <div v-if="loading" class="loading-text">{{ $t('workoutDetail.loading') }}</div>

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
                        <div class="drag-handle" :title="$t('workoutDetail.dragToReorder')">⠿</div>
                        <div>
                            <span class="exercise-name">{{ we.exercise?.name }}</span>
                            <span class="exercise-eq" v-if="we.exercise?.equipment"> · {{ we.exercise.equipment.name }}</span>
                        </div>
                        <div class="exercise-header-right">
                            <span class="volume-tag">{{ $t('workoutDetail.volumeShort', { v: totalVolume(we.sets) }) }}</span>
                            <button class="btn-delete-exercise" @click="deleteExercise(we)" :title="$t('workoutDetail.deleteExercise')">✕</button>
                        </div>
                    </div>

                    <table v-if="we.sets?.length > 0 || addingSetWeId == we.id">
                        <thead>
                            <tr>
                                <th>{{ $t('workoutDetail.table.set') }}</th>
                                <th>{{ $t('workoutDetail.table.reps') }}</th>
                                <th>{{ $t('workoutDetail.table.weight') }}</th>
                                <th>{{ $t('workoutDetail.table.rest') }}</th>
                                <th>{{ $t('workoutDetail.table.notes') }}</th>
                                <th>{{ $t('workoutDetail.table.flags') }}</th>
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
                                        <span class="set-badge failed" v-if="s.is_failed">{{ $t('workoutDetail.badges.failed') }}</span>
                                        <span class="set-badge dropset" v-if="s.is_dropset">{{ $t('workoutDetail.badges.dropset') }}</span>
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
                                        <label class="flag-check"><input type="checkbox" v-model="editFailed" /> {{ $t('workoutDetail.flagFailedShort') }}</label>
                                        <label class="flag-check"><input type="checkbox" v-model="editDropset" /> {{ $t('workoutDetail.flagDropsetShort') }}</label>
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
                                <td><input type="text" v-model="newSetNotes" class="cell-input wide" :placeholder="$t('workoutDetail.table.notes')" /></td>
                                <td>
                                    <label class="flag-check"><input type="checkbox" v-model="newFailed" /> {{ $t('workoutDetail.flagFailedShort') }}</label>
                                    <label class="flag-check"><input type="checkbox" v-model="newDropset" /> {{ $t('workoutDetail.flagDropsetShort') }}</label>
                                </td>
                                <td class="row-actions">
                                    <button class="btn-row-save" @click="saveNewSet(we)" :disabled="savingSet">✓</button>
                                    <button class="btn-row-cancel" @click="addingSetWeId = null">✕</button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                    <div v-else-if="addingSetWeId != we.id" class="empty-sets">{{ $t('workoutDetail.emptySets') }}</div>

                    <button class="btn-add-set" @click="openAddSet(we)">{{ $t('workoutDetail.addSet') }}</button>
                </div>
            </div>

            <!-- Exercise search modal -->
            <div v-if="showExerciseSearch" class="modal-overlay" @click.self="showExerciseSearch = false">
                <div class="modal">
                    <h3>{{ $t('workoutDetail.modal.title') }}</h3>
                    <div class="search-wrapper">
                        <input
                            type="text"
                            v-model="exerciseQuery"
                            :placeholder="$t('workoutDetail.modal.searchPlaceholder')"
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
                        <div v-if="filteredExercises.length === 0 && exerciseQuery" class="no-results">{{ $t('workoutDetail.modal.noResults') }}</div>
                    </div>
                    <div class="modal-actions">
                        <button class="btn-cancel" @click="showExerciseSearch = false">{{ $t('workoutDetail.modal.close') }}</button>
                    </div>
                </div>
            </div>

        </div>
    </AppPage>
</template>

<script lang="ts" src="./workout-detail.ts"></script>
<style lang="scss" src="./workout-detail.scss"></style>
