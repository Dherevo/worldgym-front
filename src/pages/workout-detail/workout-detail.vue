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
                            <span class="duration-tag" v-if="workoutKcal()">🔥 {{ workoutKcal() }}</span>
                        </h1>
                        <p class="kcal-note" v-if="workoutKcal()">{{ $t('energy.short') }}</p>
                        <form class="title-edit" v-if="editingTitle" @submit.prevent="saveTitle()">
                            <input type="text" v-model="titleDraft" :placeholder="$t('workoutDetail.titlePlaceholder')" maxlength="150" ref="titleInput" />
                            <button type="submit" class="title-save" :disabled="savingTitle">{{ $t('workoutDetail.titleSave') }}</button>
                            <button type="button" class="title-cancel" @click="editingTitle = false">{{ $t('workoutDetail.titleCancel') }}</button>
                        </form>
                        <p class="notes" v-else>
                            <span v-if="workout.notes">{{ workout.notes }}</span>
                            <button type="button" class="title-edit-btn" @click="startEditTitle()">
                                {{ workout.notes ? '✎' : $t('workoutDetail.titleAdd') }}
                            </button>
                        </p>
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
                >
                    <div class="exercise-header">
                        <div>
                            <span class="exercise-name">{{ we.exercise?.name }}</span>
                            <span class="exercise-muscle" v-if="muscleLabel(we.exercise)"> ({{ muscleLabel(we.exercise) }})</span>
                            <span class="exercise-muscle" v-if="exerciseKcal(we)"> · {{ exerciseKcal(we) }}</span>
                            <span class="exercise-eq" v-if="we.exercise?.equipment"> · {{ we.exercise.equipment.name }}</span>
                        </div>
                        <div class="exercise-header-right">
                            <button class="btn-delete-exercise" @click="openChangeExercise(we)" :title="$t('workoutDetail.changeExercise')">⇄</button>
                            <button class="btn-delete-exercise" @click="deleteExercise(we)" :title="$t('workoutDetail.deleteExercise')">✕</button>
                        </div>
                    </div>

                    <div class="table-scroll" v-if="we.sets?.length > 0 || addingSetWeId == we.id">
                    <table>
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>{{ $t('workoutDetail.table.reps') }}</th>
                                <th>{{ $t('workoutDetail.table.weight') }}</th>
                                <th>{{ $t('workoutDetail.table.rest') }}</th>
                                <th>{{ $t('workoutDetail.table.notes') }}</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            <template v-for="(s, si) in we.sets" :key="s.id">
                                <tr v-if="editingSet?.id !== s.id" :class="{ 'failed-row': s.is_failed }">
                                    <td class="c-set">{{ s.set_number }}</td>
                                    <td class="c-reps">{{ s.reps }} <small class="cmp">{{ diffText(s.reps, prevSet(we, si)?.reps) }}</small></td>
                                    <td class="c-weight">{{ s.weight }} <small class="cmp" v-if="s.weight > 0 || prevSet(we, si)?.weight > 0">{{ diffText(s.weight, prevSet(we, si)?.weight, 'kg') }}</small></td>
                                    <td class="c-rest" :class="{ empty: s.rest_seconds == null }">{{ s.rest_seconds ?? '—' }}<small class="cmp" v-if="s.duration_seconds"> · {{ $t('workoutDetail.table.setTime') }} {{ s.duration_seconds }}s</small></td>
                                    <td class="c-notes note-cell" @click="openNote($event, s.notes)">
                                        <span class="set-badge failed" v-if="s.is_failed">{{ $t('workoutDetail.badges.failed') }}</span>
                                        <span class="set-badge dropset" v-if="s.is_dropset">{{ $t('workoutDetail.badges.dropset') }}</span>
                                        <template v-if="s.notes">{{ s.notes }}</template>
                                        <template v-else-if="!s.is_failed && !s.is_dropset">—</template>
                                    </td>
                                    <td class="row-actions">
                                        <button class="btn-row-edit" @click="openSetEdit(we, s)">✎</button>
                                        <button class="btn-row-delete" @click="deleteSet(we, s)">✕</button>
                                    </td>
                                </tr>
                                <tr v-else class="editing-row">
                                    <td class="c-set">{{ s.set_number }}</td>
                                    <td class="c-reps"><input type="number" v-model.number="editReps" min="1" class="cell-input" /></td>
                                    <td class="c-weight"><input type="number" v-model.number="editWeight" min="0" step="0.5" class="cell-input" /></td>
                                    <td class="c-rest"><input type="number" v-model.number="editRest" min="0" class="cell-input" /></td>
                                    <td class="c-notes">
                                        <input type="text" v-model="editSetNotes" class="cell-input wide" />
                                        <div class="flag-row">
                                            <label class="flag-check"><input type="checkbox" v-model="editFailed" /> {{ $t('workoutDetail.flagFailedShort') }}</label>
                                            <label class="flag-check"><input type="checkbox" v-model="editDropset" /> {{ $t('workoutDetail.flagDropsetShort') }}</label>
                                        </div>
                                    </td>
                                    <td class="row-actions">
                                        <button class="btn-row-save" @click="saveSetEdit(we)" :disabled="savingSet">✓</button>
                                        <button class="btn-row-cancel" @click="editingSet = null">✕</button>
                                    </td>
                                </tr>
                            </template>
                            <!-- Add set row -->
                            <tr v-if="addingSetWeId == we.id" class="editing-row">
                                <td class="c-set">{{ (we.sets?.length ?? 0) + 1 }}</td>
                                <td class="c-reps"><input type="number" v-model.number="newReps" min="1" class="cell-input" /></td>
                                <td class="c-weight"><input type="number" v-model.number="newWeight" min="0" step="0.5" class="cell-input" /></td>
                                <td class="c-rest"><input type="number" v-model.number="newRest" min="0" class="cell-input" /></td>
                                <td class="c-notes">
                                    <input type="text" v-model="newSetNotes" class="cell-input wide" :placeholder="$t('workoutDetail.table.notes')" />
                                    <div class="flag-row">
                                        <label class="flag-check"><input type="checkbox" v-model="newFailed" /> {{ $t('workoutDetail.flagFailedShort') }}</label>
                                        <label class="flag-check"><input type="checkbox" v-model="newDropset" /> {{ $t('workoutDetail.flagDropsetShort') }}</label>
                                    </div>
                                </td>
                                <td class="row-actions">
                                    <button class="btn-row-save" @click="saveNewSet(we)" :disabled="savingSet">✓</button>
                                    <button class="btn-row-cancel" @click="addingSetWeId = null">✕</button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                    </div>
                    <div v-else-if="addingSetWeId != we.id" class="empty-sets">{{ $t('workoutDetail.emptySets') }}</div>

                    <button class="btn-add-set" @click="openAddSet(we)">{{ $t('workoutDetail.addSet') }}</button>
                </div>
            </div>

            <!-- Full note when it does not fit in the table cell -->
            <div v-if="noteText" class="modal-overlay" @click="noteText = ''">
                <div class="modal note-modal">
                    <p>{{ noteText }}</p>
                </div>
            </div>

            <!-- Exercise search modal -->
            <div v-if="showExerciseSearch" class="modal-overlay" @click.self="closeExerciseSearch()">
                <div class="modal">
                    <h3>{{ changingWe ? $t('workoutDetail.modal.changeTitle', { name: changingWe.exercise?.name }) : $t('workoutDetail.modal.title') }}</h3>
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
                            @click="pickExercise(ex)"
                        >
                            <span>{{ ex.name }}</span>
                            <small v-if="ex.equipment">{{ ex.equipment.name }}</small>
                        </div>
                        <div v-if="filteredExercises.length === 0 && exerciseQuery" class="no-results">{{ $t('workoutDetail.modal.noResults') }}</div>
                    </div>
                    <div class="modal-actions">
                        <button class="btn-cancel" @click="closeExerciseSearch()">{{ $t('workoutDetail.modal.close') }}</button>
                    </div>
                </div>
            </div>

        </div>
    </AppPage>
</template>

<script lang="ts" src="./workout-detail.ts"></script>
<style lang="scss" src="./workout-detail.scss"></style>
