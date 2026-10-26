<template>
    <AppPage name="workout-page" layout="backoffice">
        <div class="workout-page">

            <!-- Loading -->
            <div v-if="state === 'loading'" class="center-state">
                <div class="loading-text">{{ $t('workout.loading') }}</div>
            </div>

            <!-- Done -->
            <div v-else-if="state === 'done'" class="done-state">
                <div class="done-hero">
                    <div class="done-icon">🏆</div>
                    <h1>{{ $t('workout.done.title') }}</h1>
                    <p class="done-subtitle">{{ $t('workout.done.subtitle') }}</p>
                    <div class="done-duration" v-if="workoutDuration">⏱ {{ workoutDuration }}</div>
                </div>

                <div class="done-summary" v-if="completedExercises.length">
                    <div class="done-summary-title">{{ $t('workout.done.summary') }}</div>
                    <div class="done-exercise" v-for="ex in completedExercises" :key="ex.name" v-if="ex.sets.length">
                        <div class="done-ex-name">{{ ex.name }}</div>
                        <div class="done-ex-sets">
                            <span v-for="(s, i) in ex.sets" :key="i" class="done-set-pill" :class="{ failed: s.is_failed, dropset: s.is_dropset }">
                                {{ s.reps }} × {{ s.weight > 0 ? s.weight + ' kg' : $t('workout.log.bodyweightShort') }}
                            </span>
                        </div>
                    </div>
                </div>

                <button class="btn-primary" @click="to('/')">{{ $t('workout.done.backToDashboard') }}</button>
            </div>

            <!-- Guided flow -->
            <div v-else class="guided-flow">

                <!-- Header -->
                <div class="workout-header">
                    <div>
                        <div class="workout-label">{{ $t('workout.header.active') }}</div>
                        <div class="workout-notes" v-if="workout?.notes">{{ workout.notes }}</div>
                    </div>
                    <button class="btn-finish-small" @click="finishWorkout()">{{ $t('workout.header.finish') }}</button>
                </div>

                <!-- Mini exercise plan (només rutina) -->
                <div class="exercise-plan" v-if="!isFreeWorkout && exercises.length > 1">
                    <div
                        v-for="(ex, i) in exercises"
                        :key="ex.id"
                        class="plan-item"
                        :class="{ done: i < currentExerciseIdx, current: i === currentExerciseIdx }"
                    >
                        <span class="plan-dot"></span>
                        <span class="plan-name">{{ ex.exercise?.name }}</span>
                    </div>
                </div>

                <!-- Progress bar (només rutina) -->
                <div class="progress-bar" v-if="!isFreeWorkout && exercises.length > 0">
                    <div
                        class="progress-fill"
                        :style="{ width: (currentExerciseIdx / exercises.length * 100) + '%' }"
                    ></div>
                </div>
                <div class="progress-label" v-if="!isFreeWorkout">
                    {{ $t('workout.exerciseProgress', { current: currentExerciseIdx + 1, total: exercises.length }) }}
                </div>

                <!-- STATE: pick-exercise -->
                <div v-if="state === 'pick-exercise'" class="action-block pick-exercise-block">
                    <p class="action-label">{{ $t('workout.pick.question') }}</p>
                    <div class="exercise-search-wrap">
                        <input
                            type="text"
                            v-model="exerciseQuery"
                            :placeholder="$t('workout.pick.searchPlaceholder')"
                            @input="filterExercises()"
                        />
                        <div class="exercise-dropdown" v-if="exerciseResults.length">
                            <div
                                v-for="ex in exerciseResults"
                                :key="ex.id"
                                class="exercise-dropdown-item"
                                @mousedown="pickExercise(ex)"
                            >
                                <span>{{ ex.name }}</span>
                                <small v-if="ex.equipment">{{ ex.equipment.name }}</small>
                            </div>
                        </div>
                    </div>
                    <div v-if="addingExercise" class="loading-text">{{ $t('workout.pick.adding') }}</div>
                    <button
                        v-if="exercises.length > 0"
                        class="btn-action skip"
                        @click="finishWorkout()"
                    >{{ $t('workout.pick.finishWorkout') }}</button>
                </div>

                <!-- Historial últimes sessions (exercici actual) -->
                <div class="exercise-history" v-if="exerciseHistory.length && state !== 'pick-exercise'">
                    <div class="history-title">
                        {{ $t('workout.history.title') }}
                        <span class="record-badge" v-if="exerciseRecord">
                            🏆 {{ exerciseRecord.weight }} kg × {{ exerciseRecord.reps }} {{ $t('workout.history.reps') }}
                        </span>
                    </div>
                    <div class="history-rows">
                        <div v-for="s in exerciseHistory" :key="s.date" class="history-row">
                            <span class="history-date">{{ formatHistoryDate(s.date) }}</span>
                            <template v-if="parseInt(s.total_reps) > 0">
                                <span class="history-stat"><b>{{ s.max_weight }} kg</b></span>
                                <span class="history-stat">{{ parseFloat(s.avg_reps).toFixed(0) }} {{ $t('workout.history.reps') }}</span>
                                <span class="history-stat muted">{{ s.total_sets }} {{ $t('workout.history.sets') }}</span>
                            </template>
                            <span v-else class="history-empty">{{ $t('workout.history.noData') }}</span>
                        </div>
                    </div>
                </div>

                <!-- Exercise card + acció (unificats) -->
                <div class="exercise-card" v-if="currentExercise && state !== 'pick-exercise'">

                    <!-- Info exercici -->
                    <div class="exercise-name">{{ currentExercise.exercise?.name }}</div>
                    <div class="exercise-eq" v-if="currentExercise.exercise?.equipment">
                        {{ currentExercise.exercise.equipment.name }}
                    </div>
                    <div class="set-info" v-if="totalSets > 0">
                        {{ $t('workout.card.setOf', { current: doneCount + 1, total: totalSets }) }}
                    </div>
                    <div class="set-info" v-else>
                        {{ $t('workout.card.set', { current: doneCount + 1 }) }}
                    </div>
                    <div class="target-hint" v-if="targetSet">
                        {{ $t('workout.card.target') }}: {{ targetSet.reps }} {{ $t('workout.history.reps') }}<template v-if="targetSet.weight > 0"> · {{ targetSet.weight }} kg</template><template v-if="targetRestLabel"> · {{ targetRestLabel }}</template>
                    </div>

                    <div class="card-divider"></div>

                    <!-- STATE: idle -->
                    <template v-if="state === 'idle'">
                        <button class="btn-action start" @click="startSet()">{{ $t('workout.card.start') }}</button>
                    </template>

                    <!-- STATE: active -->
                    <template v-else-if="state === 'active'">
                        <div class="big-timer">{{ exerciseFormatted }}</div>
                        <p class="action-label">{{ $t('workout.card.inProgress') }}</p>
                        <button class="btn-action stop" @click="stopSet()">{{ $t('workout.card.stop') }}</button>
                    </template>

                    <!-- STATE: logging -->
                    <template v-else-if="state === 'logging'">
                        <p class="action-label">{{ $t('workout.log.question') }}</p>
                        <div class="log-form">
                            <div class="log-field">
                                <label>{{ $t('workout.log.repetitions') }}</label>
                                <div class="number-input">
                                    <button @click="logReps = Math.max(1, logReps - 1)">−</button>
                                    <input type="number" v-model.number="logReps" min="1" />
                                    <button @click="logReps++">+</button>
                                </div>
                            </div>
                            <div class="log-field" v-if="!isBodyweight">
                                <label>{{ $t('workout.log.weightKg') }}</label>
                                <div class="number-input">
                                    <button @click="logWeight = Math.max(0, logWeight - 2.5)">−</button>
                                    <input type="number" v-model.number="logWeight" min="0" step="0.5" />
                                    <button @click="logWeight += 2.5">+</button>
                                </div>
                            </div>
                            <div class="log-field" v-else>
                                <label>{{ $t('workout.log.weight') }}</label>
                                <span class="bw-badge">{{ $t('workout.log.bodyweight') }}</span>
                            </div>
                        </div>
                        <div class="set-flags">
                            <button
                                class="flag-btn failed"
                                :class="{ active: logFailed }"
                                @click="logFailed = !logFailed"
                                type="button"
                                :data-tooltip="$t('workout.log.failedTooltip')"
                            >✕ {{ $t('workout.log.failed') }}</button>
                            <button
                                class="flag-btn dropset"
                                :class="{ active: logDropset }"
                                @click="logDropset = !logDropset"
                                type="button"
                                :data-tooltip="$t('workout.log.dropsetTooltip')"
                            >↓ {{ $t('workout.log.dropset') }}</button>
                        </div>
                        <input
                            type="text"
                            class="log-notes"
                            v-model="logNotes"
                            :placeholder="$t('workout.log.notesPlaceholder')"
                        />
                        <button class="btn-action confirm" @click="submitSet()" :disabled="savingSet">
                            {{ savingSet ? $t('workout.log.saving') : $t('workout.log.confirm') }}
                        </button>
                    </template>

                    <!-- STATE: resting -->
                    <template v-else-if="state === 'resting'">
                        <p class="action-label">{{ $t('workout.rest.title') }}</p>
                        <div class="big-timer rest">{{ restFormatted }}</div>
                        <div class="rest-adjust">
                            <button class="btn-adjust" @click="adjustRest(-30)">−30s</button>
                            <button class="btn-adjust" @click="adjustRest(30)">+30s</button>
                        </div>
                        <button class="btn-action skip" @click="skipRest()">{{ $t('workout.rest.skip') }}</button>
                    </template>

                    <!-- STATE: choose -->
                    <template v-else-if="state === 'choose'">
                        <p class="action-label">{{ $t('workout.choose.question') }}</p>
                        <div class="choose-buttons">
                            <button class="btn-action start" @click="continueSet()">{{ $t('workout.choose.anotherSet') }}</button>
                            <button class="btn-action skip" @click="nextExercise()">
                                {{ isFreeWorkout || currentExerciseIdx + 1 < exercises.length ? $t('workout.choose.nextExercise') : $t('workout.choose.end') }}
                            </button>
                        </div>
                    </template>

                </div>

                <!-- Workout progress: tots els exercicis -->
                <div class="workout-progress" v-if="exercises.length && state !== 'done'">
                    <div class="progress-section-title">{{ $t('workout.progress.title') }}</div>

                    <div
                        v-for="(ex, exIdx) in exercises"
                        :key="ex.id"
                        class="progress-exercise"
                        :class="{
                            'ex-done': exIdx < currentExerciseIdx,
                            'ex-current': exIdx === currentExerciseIdx,
                            'ex-future': exIdx > currentExerciseIdx
                        }"
                    >
                        <div class="progress-ex-header">
                            <span class="progress-ex-name">{{ ex.exercise?.name }}</span>
                            <span class="progress-ex-badge done" v-if="exIdx < currentExerciseIdx">✓</span>
                            <span class="progress-ex-badge current" v-else-if="exIdx === currentExerciseIdx">{{ $t('workout.progress.current') }}</span>
                        </div>

                        <table>
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>{{ $t('workout.progress.reps') }}</th>
                                    <th>{{ $t('workout.progress.weight') }}</th>
                                    <th>{{ $t('workout.progress.notes') }}</th>
                                </tr>
                            </thead>
                            <tbody>

                                <!-- Exercici passat: dades ja guardades -->
                                <template v-if="exIdx < currentExerciseIdx">
                                    <template v-if="completedExercises[exIdx]?.sets?.length">
                                        <tr v-for="(s, i) in completedExercises[exIdx].sets" :key="i" class="set-row-done">
                                            <td>{{ s.set_number ?? i + 1 }}</td>
                                            <td>{{ s.reps }}</td>
                                            <td>{{ s.weight > 0 ? s.weight + ' kg' : $t('workout.log.bodyweightShort') }}</td>
                                            <td>{{ s.notes || '—' }}</td>
                                        </tr>
                                    </template>
                                    <tr v-else class="set-row-empty">
                                        <td colspan="4">{{ $t('workout.progress.noSetsLogged') }}</td>
                                    </tr>
                                </template>

                                <!-- Exercici actual -->
                                <template v-else-if="exIdx === currentExerciseIdx">
                                    <!-- Sèries ja fetes -->
                                    <tr v-for="(s, i) in loggedSets" :key="'done-' + i" class="set-row-done">
                                        <td>{{ s.set_number }}</td>
                                        <td>{{ s.reps }}</td>
                                        <td>{{ s.weight > 0 ? s.weight + ' kg' : $t('workout.log.bodyweightShort') }}</td>
                                        <td>{{ s.notes || '—' }}</td>
                                    </tr>

                                    <!-- Fila live: valors que s'estan introduint -->
                                    <tr v-if="state === 'logging'" class="set-row-live">
                                        <td>{{ doneCount + 1 }}</td>
                                        <td>{{ logReps }}</td>
                                        <td>{{ isBodyweight ? $t('workout.log.bodyweightShort') : (logWeight + ' kg') }}</td>
                                        <td>{{ logNotes || '—' }}</td>
                                    </tr>

                                    <!-- Sèries pendents (rutina) -->
                                    <template v-if="totalSets > 0">
                                        <tr
                                            v-for="(s, i) in currentExercise.sets.slice(doneCount + (state === 'logging' ? 1 : 0))"
                                            :key="'pend-' + i"
                                            class="set-row-pending"
                                        >
                                            <td>{{ doneCount + (state === 'logging' ? 1 : 0) + i + 1 }}</td>
                                            <td><span class="plan-val">{{ s.reps }}</span></td>
                                            <td><span class="plan-val">{{ s.weight > 0 ? s.weight + ' kg' : $t('workout.log.bodyweightShort') }}</span></td>
                                            <td><span class="plan-val">—</span></td>
                                        </tr>
                                    </template>

                                    <!-- Buit (entrenament lliure, cap sèrie) -->
                                    <tr v-if="loggedSets.length === 0 && state !== 'logging' && totalSets <= 0" class="set-row-empty">
                                        <td colspan="4">{{ $t('workout.progress.noSetsYet') }}</td>
                                    </tr>
                                </template>

                                <!-- Exercici futur: mostrar pla si en té -->
                                <template v-else>
                                    <template v-if="ex.sets && ex.sets.length > 0">
                                        <tr v-for="(s, i) in ex.sets" :key="s.id ?? i" class="set-row-future">
                                            <td>{{ i + 1 }}</td>
                                            <td><span class="plan-val">{{ s.reps }}</span></td>
                                            <td><span class="plan-val">{{ s.weight > 0 ? s.weight + ' kg' : $t('workout.log.bodyweightShort') }}</span></td>
                                            <td><span class="plan-val">—</span></td>
                                        </tr>
                                    </template>
                                    <tr v-else class="set-row-empty">
                                        <td colspan="4">{{ $t('workout.progress.pending') }}</td>
                                    </tr>
                                </template>

                            </tbody>
                        </table>
                    </div>
                </div>

            </div>

        </div>
    </AppPage>
</template>

<script lang="ts" src="./workout.ts"></script>
<style lang="scss" src="./workout.scss"></style>
