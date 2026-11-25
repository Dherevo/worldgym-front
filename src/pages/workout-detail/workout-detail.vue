<template>
    <AppPage name="workout-detail-page" layout="backoffice">
        <div class="workout-detail-page">

            <div class="page-header">
                <BackButton class="btn-back" :label="$t('workoutDetail.back')" @click="goBack()" />
                <div v-if="workout" class="header-info">
                    <div>
                        <h1>
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
                        <div class="exercise-name exercise-link" @click="to('/exercise/' + we.exercise?.id)">{{ we.exercise?.name }}<small v-if="we.variant" class="exercise-variant"> · {{ we.variant }}</small></div>
                        <div class="exercise-meta" v-if="exerciseMeta(we)">{{ exerciseMeta(we) }}</div>
                    </div>

                    <!-- Sets: rows with the edit / delete of the app (the dots of SwipeRow) -->
                    <div class="sets-table" v-if="we.sets?.length > 0 || addingSetWeId == we.id">
                        <div class="set-row set-head">
                            <span>#</span>
                            <span>{{ $t('workoutDetail.table.reps') }}</span>
                            <span>{{ $t('workoutDetail.table.weight') }}</span>
                            <span>{{ $t('workoutDetail.table.rest') }}</span>
                        </div>

                        <template v-for="(s, si) in we.sets" :key="s.id">
                            <SwipeRow v-if="editingSet?.id !== s.id" @edit="openSetEdit(we, s)" @delete="deleteSet(we, s)">
                                <div class="set-row" :class="{ 'failed-row': s.is_failed }">
                                    <span class="c-set">{{ s.set_number }}</span>
                                    <span class="c-reps">{{ we.exercise?.is_timed ? s.reps + ' s' : s.reps }}<small class="cmp" v-if="prevSet(we, si)">{{ diffText(s.reps, prevSet(we, si)?.reps) }}</small></span>
                                    <span class="c-weight">{{ weightLabel(s.weight) }}<small class="cmp" v-if="s.weight > 0 || prevSet(we, si)?.weight > 0">{{ diffText(s.weight, prevSet(we, si)?.weight, 'kg') }}</small></span>
                                    <span class="c-rest">{{ s.rest_seconds ?? '—' }}<small class="cmp" v-if="s.duration_seconds">{{ $t('workoutDetail.table.setTime') }} {{ s.duration_seconds }}s</small></span>
                                    <div class="set-extra" v-if="s.is_failed || s.is_dropset || s.notes">
                                        <span class="set-badge failed" v-if="s.is_failed">{{ $t('workoutDetail.badges.failed') }}</span>
                                        <span class="set-badge dropset" v-if="s.is_dropset">{{ $t('workoutDetail.badges.dropset') }}</span>
                                        <!-- The note: one discreet line, and a tap opens it whole in place -->
                                        <span class="set-note" v-if="s.notes" :class="{ open: openNoteId === s.id }" @click="toggleNote(s.id)">💬 {{ s.notes }}</span>
                                    </div>
                                </div>
                            </SwipeRow>

                            <div v-else class="set-row editing">
                                <span class="c-set">{{ s.set_number }}</span>
                                <input type="number" v-model.number="editReps" min="1" class="cell-input" />
                                <input type="number" v-model.number="editWeight" min="0" step="0.5" class="cell-input" />
                                <input type="number" v-model.number="editRest" min="0" class="cell-input" />
                                <div class="set-edit-extra">
                                    <input type="text" v-model="editSetNotes" class="cell-input" :placeholder="$t('workoutDetail.table.notes')" />
                                    <div class="flag-row">
                                        <label class="flag-check"><input type="checkbox" v-model="editFailed" /> {{ $t('workoutDetail.flagFailedShort') }}</label>
                                        <label class="flag-check"><input type="checkbox" v-model="editDropset" /> {{ $t('workoutDetail.flagDropsetShort') }}</label>
                                    </div>
                                </div>
                                <div class="set-edit-actions">
                                    <button type="button" class="icon-action" :aria-label="$t('workoutDetail.titleCancel')" @click="editingSet = null">✕</button>
                                    <button type="button" class="icon-action ok" :aria-label="$t('workoutDetail.titleSave')" :disabled="savingSet" @click="saveSetEdit(we)">✓</button>
                                </div>
                            </div>
                        </template>

                        <!-- New set -->
                        <div v-if="addingSetWeId == we.id" class="set-row editing">
                            <span class="c-set">{{ (we.sets?.length ?? 0) + 1 }}</span>
                            <input type="number" v-model.number="newReps" min="1" class="cell-input" />
                            <input type="number" v-model.number="newWeight" min="0" step="0.5" class="cell-input" />
                            <input type="number" v-model.number="newRest" min="0" class="cell-input" />
                            <div class="set-edit-extra">
                                <input type="text" v-model="newSetNotes" class="cell-input" :placeholder="$t('workoutDetail.table.notes')" />
                                <div class="flag-row">
                                    <label class="flag-check"><input type="checkbox" v-model="newFailed" /> {{ $t('workoutDetail.flagFailedShort') }}</label>
                                    <label class="flag-check"><input type="checkbox" v-model="newDropset" /> {{ $t('workoutDetail.flagDropsetShort') }}</label>
                                </div>
                            </div>
                            <div class="set-edit-actions">
                                <button type="button" class="icon-action" :aria-label="$t('workoutDetail.titleCancel')" @click="addingSetWeId = null">✕</button>
                                <button type="button" class="icon-action ok" :aria-label="$t('workoutDetail.titleSave')" :disabled="savingSet" @click="saveNewSet(we)">✓</button>
                            </div>
                        </div>
                    </div>
                    <div v-else-if="addingSetWeId != we.id" class="empty-sets">{{ $t('workoutDetail.emptySets') }}</div>

                    <!-- Actions of the exercise at the bottom, as icons -->
                    <div class="exercise-footer">
                        <button class="btn-add-set" @click="openAddSet(we)">{{ $t('workoutDetail.addSet') }}</button>
                        <button type="button" class="icon-action" :aria-label="$t('workoutDetail.changeExercise')" @click="openChangeExercise(we)">
                            <svg-icon name="heroicons-outline/arrows-right-left" />
                        </button>
                        <button type="button" class="icon-action danger" :aria-label="$t('workoutDetail.deleteExercise')" @click="deleteExercise(we)">
                            <svg-icon name="heroicons-outline/trash" />
                        </button>
                    </div>
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
                        <SearchInput
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
