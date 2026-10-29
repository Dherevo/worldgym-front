<template>
    <AppPage name="routine-detail-page" layout="backoffice">
        <div class="routine-detail-page">

            <div class="page-header">
                <button class="btn-back" @click="to('/routines')">{{ $t('routineDetail.back') }}</button>
                <h1 v-if="routine">{{ routine.name }}</h1>
                <div class="header-actions" v-if="routine && canEdit">
                    <button class="btn-secondary" @click="openAddDay()">{{ $t('routineDetail.addDay') }}</button>
                </div>
            </div>

            <div v-if="loading" class="loading-text">{{ $t('routineDetail.loading') }}</div>

            <div v-else-if="routine" class="days-list">
                <div v-if="routine.days?.length === 0" class="empty-text">
                    {{ $t('routineDetail.noDays') }}
                </div>
                <div v-for="(day, di) in routine.days" :key="day.id" class="day-card"
                    :class="{ dragging: dragKind === 'day' && dragFromIdx === di }"
                    @dragover.prevent @drop="dropDay(di)">
                    <div class="day-header">
                        <div class="day-title">
                            <span v-if="canEdit" class="drag-handle" draggable="true" :title="$t('routineDetail.dragToReorder')"
                                @dragstart="dragStart('day', di)" @dragend="dragEnd()">⠿</span>
                            <span class="day-name">{{ day.name || $t('routineDetail.dayNumber', { n: day.day_number }) }}</span>
                            <span v-for="g in dayGroups(day)" :key="g.id" class="group-chip">{{ g.name }}</span>
                        </div>
                        <div class="day-actions">
                            <button class="btn-train" @click="startDay(day)" :disabled="starting">
                                {{ starting ? '...' : $t('routineDetail.train') }}
                            </button>
                            <button v-if="canEdit" @click="openEditDay(day)">{{ $t('routineDetail.edit') }}</button>
                            <button v-if="canEdit" class="danger" @click="deleteDay(day)">{{ $t('routineDetail.delete') }}</button>
                        </div>
                    </div>

                    <div class="exercises-table" v-if="day.exercises?.length > 0">
                        <table>
                            <thead>
                                <tr>
                                    <th>{{ $t('routineDetail.table.exercise') }}</th>
                                    <th>{{ $t('routineDetail.table.sets') }}</th>
                                    <th>{{ $t('routineDetail.table.reps') }}</th>
                                    <th>{{ $t('routineDetail.table.weight') }}</th>
                                    <th>{{ $t('routineDetail.table.rest') }}</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="(ex, ei) in day.exercises" :key="ex.id"
                                    :class="{ dragging: dragKind === 'exercise' && dragDayId === day.id && dragFromIdx === ei }"
                                    @dragover.prevent @drop.stop="dropExercise(day, ei)">
                                    <td>
                                        <span v-if="canEdit" class="drag-handle" draggable="true" :title="$t('routineDetail.dragToReorder')"
                                            @dragstart.stop="dragStart('exercise', ei, day.id)" @dragend="dragEnd()">⠿</span>
                                        {{ ex.exercise?.name }}
                                    </td>
                                    <td>{{ ex.sets_target }}</td>
                                    <td>{{ ex.reps_target }}</td>
                                    <td>{{ ex.weight_target }}</td>
                                    <td>{{ ex.rest_seconds }}s</td>
                                    <td>
                                        <button v-if="canEdit" @click="openEditExercise(day, ex)">{{ $t('routineDetail.table.editShort') }}</button>
                                        <button v-if="canEdit" class="danger" @click="deleteExercise(day, ex)">{{ $t('routineDetail.table.deleteShort') }}</button>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <div v-else class="empty-exercises">{{ $t('routineDetail.noExercises') }} <span class="link" v-if="canEdit" @click="openAddExercise(day)">{{ $t('routineDetail.addOne') }}</span></div>
                    <button class="btn-add-exercise" v-if="canEdit" @click="openAddExercise(day)">{{ $t('routineDetail.addExercise') }}</button>
                </div>
            </div>

            <!-- Day Form Modal -->
            <div v-if="showDayForm" class="modal-overlay" @click.self="showDayForm = false">
                <div class="modal">
                    <h2>{{ editingDay ? $t('routineDetail.dayForm.titleEdit') : $t('routineDetail.dayForm.titleNew') }}</h2>
                    <div class="form-group">
                        <label>{{ $t('routineDetail.dayForm.dayNumber') }}</label>
                        <input type="number" v-model.number="dayForm.day_number" min="1" />
                    </div>
                    <div class="form-group">
                        <label>{{ $t('routineDetail.dayForm.name') }}</label>
                        <input type="text" v-model="dayForm.name" :placeholder="$t('routineDetail.dayForm.namePlaceholder')" />
                    </div>
                    <div class="form-actions">
                        <button class="btn-cancel" @click="showDayForm = false">{{ $t('routineDetail.cancel') }}</button>
                        <button class="btn-primary" @click="saveDay()" :disabled="savingDay">
                            {{ savingDay ? $t('routineDetail.saving') : $t('routineDetail.save') }}
                        </button>
                    </div>
                </div>
            </div>

            <!-- Exercise Form Modal -->
            <div v-if="showExerciseForm" class="modal-overlay" @click.self="showExerciseForm = false">
                <div class="modal">
                    <h2>{{ editingExercise ? $t('routineDetail.exerciseForm.titleEdit') : $t('routineDetail.exerciseForm.titleNew') }}</h2>
                    <div class="form-group">
                        <label>{{ $t('routineDetail.exerciseForm.exercise') }}</label>
                        <div v-if="exerciseForm.exercise_id" class="selected-exercise">
                            <span>{{ selectedExerciseName }}</span>
                            <button type="button" @click="clearSelectedExercise()">{{ $t('routineDetail.exerciseForm.change') }}</button>
                        </div>
                        <div v-else class="exercise-search">
                            <input type="text" v-model="exerciseQuery" autofocus
                                   :placeholder="$t('routineDetail.exerciseForm.searchPlaceholder')" />
                            <div class="exercise-results">
                                <template v-for="g in groupedExercises" :key="g.name">
                                    <div class="result-group">{{ g.name }}</div>
                                    <div v-for="ex in g.items" :key="ex.id" class="exercise-result-item"
                                         @click="selectExercise(ex)">{{ ex.name }}</div>
                                </template>
                                <div v-if="groupedExercises.length === 0" class="no-results">{{ $t('routineDetail.exerciseForm.noResults') }}</div>
                            </div>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>{{ $t('routineDetail.exerciseForm.sets') }}</label>
                            <input type="number" v-model.number="exerciseForm.sets_target" min="1" />
                        </div>
                        <div class="form-group">
                            <label>{{ $t('routineDetail.exerciseForm.reps') }}</label>
                            <input type="number" v-model.number="exerciseForm.reps_target" min="1" />
                        </div>
                        <div class="form-group">
                            <label>{{ $t('routineDetail.exerciseForm.weight') }}</label>
                            <input type="number" v-model.number="exerciseForm.weight_target" min="0" step="0.5" />
                        </div>
                        <div class="form-group">
                            <label>{{ $t('routineDetail.exerciseForm.rest') }}</label>
                            <input type="number" v-model.number="exerciseForm.rest_seconds" min="0" step="15" />
                        </div>
                    </div>
                    <div class="form-actions">
                        <button class="btn-cancel" @click="showExerciseForm = false">{{ $t('routineDetail.cancel') }}</button>
                        <button class="btn-primary" @click="saveExercise()" :disabled="savingExercise">
                            {{ savingExercise ? $t('routineDetail.saving') : $t('routineDetail.save') }}
                        </button>
                    </div>
                </div>
            </div>

        </div>
    </AppPage>
</template>

<script lang="ts" src="./routine-detail.ts"></script>
<style lang="scss" src="./routine-detail.scss"></style>
