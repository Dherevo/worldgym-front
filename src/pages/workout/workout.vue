<template>
    <AppPage name="workout-page" layout="backoffice">
        <div class="workout-page">

            <!-- Loading -->
            <div v-if="state === 'loading'" class="center-state">
                <div class="loading-text">Carregant entrenament...</div>
            </div>

            <!-- Done -->
            <div v-else-if="state === 'done'" class="done-state">
                <div class="done-hero">
                    <div class="done-icon">🏆</div>
                    <h1>Enhorabona!</h1>
                    <p class="done-subtitle">Has completat la rutina d'avui</p>
                    <div class="done-duration" v-if="workoutDuration">⏱ {{ workoutDuration }}</div>
                </div>

                <div class="done-summary" v-if="completedExercises.length">
                    <div class="done-summary-title">Resum</div>
                    <div class="done-exercise" v-for="ex in completedExercises" :key="ex.name" v-if="ex.sets.length">
                        <div class="done-ex-name">{{ ex.name }}</div>
                        <div class="done-ex-sets">
                            <span v-for="(s, i) in ex.sets" :key="i" class="done-set-pill" :class="{ failed: s.is_failed, dropset: s.is_dropset }">
                                {{ s.reps }} × {{ s.weight > 0 ? s.weight + ' kg' : 'PC' }}
                            </span>
                        </div>
                    </div>
                </div>

                <button class="btn-primary" @click="to('/')">Tornar al Dashboard</button>
            </div>

            <!-- Guided flow -->
            <div v-else class="guided-flow">

                <!-- Header -->
                <div class="workout-header">
                    <div>
                        <div class="workout-label">Entrenament actiu</div>
                        <div class="workout-notes" v-if="workout?.notes">{{ workout.notes }}</div>
                    </div>
                    <button class="btn-finish-small" @click="finishWorkout()">Finalitzar</button>
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
                    Exercici {{ currentExerciseIdx + 1 }} de {{ exercises.length }}
                </div>

                <!-- STATE: pick-exercise -->
                <div v-if="state === 'pick-exercise'" class="action-block pick-exercise-block">
                    <p class="action-label">Quin exercici fas?</p>
                    <div class="exercise-search-wrap">
                        <input
                            type="text"
                            v-model="exerciseQuery"
                            placeholder="Cerca un exercici..."
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
                    <div v-if="addingExercise" class="loading-text">Afegint...</div>
                    <button
                        v-if="exercises.length > 0"
                        class="btn-action skip"
                        @click="finishWorkout()"
                    >Finalitzar entrenament</button>
                </div>

                <!-- Historial últimes sessions (exercici actual) -->
                <div class="exercise-history" v-if="exerciseHistory.length && state !== 'pick-exercise'">
                    <div class="history-title">
                        Últimes sessions
                        <span class="record-badge" v-if="exerciseRecord">
                            🏆 {{ exerciseRecord.weight }} kg × {{ exerciseRecord.reps }} reps
                        </span>
                    </div>
                    <div class="history-rows">
                        <div v-for="s in exerciseHistory" :key="s.date" class="history-row">
                            <span class="history-date">{{ formatHistoryDate(s.date) }}</span>
                            <template v-if="parseInt(s.total_reps) > 0">
                                <span class="history-stat"><b>{{ s.max_weight }} kg</b></span>
                                <span class="history-stat">{{ parseFloat(s.avg_reps).toFixed(0) }} reps</span>
                                <span class="history-stat muted">{{ s.total_sets }} sèries</span>
                            </template>
                            <span v-else class="history-empty">Sense dades</span>
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
                        Sèrie {{ doneCount + 1 }} de {{ totalSets }}
                    </div>
                    <div class="set-info" v-else>
                        Sèrie {{ doneCount + 1 }}
                    </div>
                    <div class="target-hint" v-if="targetSet">
                        Objectiu: {{ targetSet.reps }} reps<template v-if="targetSet.weight > 0"> · {{ targetSet.weight }} kg</template><template v-if="targetRestLabel"> · {{ targetRestLabel }}</template>
                    </div>

                    <div class="card-divider"></div>

                    <!-- STATE: idle -->
                    <template v-if="state === 'idle'">
                        <button class="btn-action start" @click="startSet()">Començar sèrie</button>
                    </template>

                    <!-- STATE: active -->
                    <template v-else-if="state === 'active'">
                        <div class="big-timer">{{ exerciseFormatted }}</div>
                        <p class="action-label">Sèrie en curs...</p>
                        <button class="btn-action stop" @click="stopSet()">Parar</button>
                    </template>

                    <!-- STATE: logging -->
                    <template v-else-if="state === 'logging'">
                        <p class="action-label">Quantes reps i quin pes has fet?</p>
                        <div class="log-form">
                            <div class="log-field">
                                <label>Repeticions</label>
                                <div class="number-input">
                                    <button @click="logReps = Math.max(1, logReps - 1)">−</button>
                                    <input type="number" v-model.number="logReps" min="1" />
                                    <button @click="logReps++">+</button>
                                </div>
                            </div>
                            <div class="log-field" v-if="!isBodyweight">
                                <label>Pes (kg)</label>
                                <div class="number-input">
                                    <button @click="logWeight = Math.max(0, logWeight - 2.5)">−</button>
                                    <input type="number" v-model.number="logWeight" min="0" step="0.5" />
                                    <button @click="logWeight += 2.5">+</button>
                                </div>
                            </div>
                            <div class="log-field" v-else>
                                <label>Pes</label>
                                <span class="bw-badge">Pes corporal</span>
                            </div>
                        </div>
                        <div class="set-flags">
                            <button
                                class="flag-btn failed"
                                :class="{ active: logFailed }"
                                @click="logFailed = !logFailed"
                                type="button"
                                data-tooltip="Has arribat al límit: no podies fer cap rep més"
                            >✕ Fallada</button>
                            <button
                                class="flag-btn dropset"
                                :class="{ active: logDropset }"
                                @click="logDropset = !logDropset"
                                type="button"
                                data-tooltip="Has baixat el pes i continuat sense descansar"
                            >↓ Dropset</button>
                        </div>
                        <input
                            type="text"
                            class="log-notes"
                            v-model="logNotes"
                            placeholder="Notes (opcional)..."
                        />
                        <button class="btn-action confirm" @click="submitSet()" :disabled="savingSet">
                            {{ savingSet ? 'Desant...' : 'Confirmar i descansar' }}
                        </button>
                    </template>

                    <!-- STATE: resting -->
                    <template v-else-if="state === 'resting'">
                        <p class="action-label">Descansa!</p>
                        <div class="big-timer rest">{{ restFormatted }}</div>
                        <div class="rest-adjust">
                            <button class="btn-adjust" @click="adjustRest(-30)">−30s</button>
                            <button class="btn-adjust" @click="adjustRest(30)">+30s</button>
                        </div>
                        <button class="btn-action skip" @click="skipRest()">Saltar descans</button>
                    </template>

                    <!-- STATE: choose -->
                    <template v-else-if="state === 'choose'">
                        <p class="action-label">Vols fer una altra sèrie?</p>
                        <div class="choose-buttons">
                            <button class="btn-action start" @click="continueSet()">Una altra sèrie</button>
                            <button class="btn-action skip" @click="nextExercise()">
                                {{ isFreeWorkout ? 'Exercici següent' : (currentExerciseIdx + 1 < exercises.length ? 'Exercici següent' : 'Acabar') }}
                            </button>
                        </div>
                    </template>

                </div>

                <!-- Workout progress: tots els exercicis -->
                <div class="workout-progress" v-if="exercises.length && state !== 'done'">
                    <div class="progress-section-title">Progrés</div>

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
                            <span class="progress-ex-badge current" v-else-if="exIdx === currentExerciseIdx">En curs</span>
                        </div>

                        <table>
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Reps</th>
                                    <th>Pes</th>
                                    <th>Notes</th>
                                </tr>
                            </thead>
                            <tbody>

                                <!-- Exercici passat: dades ja guardades -->
                                <template v-if="exIdx < currentExerciseIdx">
                                    <template v-if="completedExercises[exIdx]?.sets?.length">
                                        <tr v-for="(s, i) in completedExercises[exIdx].sets" :key="i" class="set-row-done">
                                            <td>{{ s.set_number ?? i + 1 }}</td>
                                            <td>{{ s.reps }}</td>
                                            <td>{{ s.weight > 0 ? s.weight + ' kg' : 'PC' }}</td>
                                            <td>{{ s.notes || '—' }}</td>
                                        </tr>
                                    </template>
                                    <tr v-else class="set-row-empty">
                                        <td colspan="4">Cap sèrie registrada</td>
                                    </tr>
                                </template>

                                <!-- Exercici actual -->
                                <template v-else-if="exIdx === currentExerciseIdx">
                                    <!-- Sèries ja fetes -->
                                    <tr v-for="(s, i) in loggedSets" :key="'done-' + i" class="set-row-done">
                                        <td>{{ s.set_number }}</td>
                                        <td>{{ s.reps }}</td>
                                        <td>{{ s.weight > 0 ? s.weight + ' kg' : 'PC' }}</td>
                                        <td>{{ s.notes || '—' }}</td>
                                    </tr>

                                    <!-- Fila live: valors que s'estan introduint -->
                                    <tr v-if="state === 'logging'" class="set-row-live">
                                        <td>{{ doneCount + 1 }}</td>
                                        <td>{{ logReps }}</td>
                                        <td>{{ isBodyweight ? 'PC' : (logWeight + ' kg') }}</td>
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
                                            <td><span class="plan-val">{{ s.weight > 0 ? s.weight + ' kg' : 'PC' }}</span></td>
                                            <td><span class="plan-val">—</span></td>
                                        </tr>
                                    </template>

                                    <!-- Buit (entrenament lliure, cap sèrie) -->
                                    <tr v-if="loggedSets.length === 0 && state !== 'logging' && totalSets <= 0" class="set-row-empty">
                                        <td colspan="4">Cap sèrie feta encara</td>
                                    </tr>
                                </template>

                                <!-- Exercici futur: mostrar pla si en té -->
                                <template v-else>
                                    <template v-if="ex.sets && ex.sets.length > 0">
                                        <tr v-for="(s, i) in ex.sets" :key="s.id ?? i" class="set-row-future">
                                            <td>{{ i + 1 }}</td>
                                            <td><span class="plan-val">{{ s.reps }}</span></td>
                                            <td><span class="plan-val">{{ s.weight > 0 ? s.weight + ' kg' : 'PC' }}</span></td>
                                            <td><span class="plan-val">—</span></td>
                                        </tr>
                                    </template>
                                    <tr v-else class="set-row-empty">
                                        <td colspan="4">Pendent</td>
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
