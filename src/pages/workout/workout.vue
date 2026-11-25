<template>
    <AppPage name="workout-page" layout="backoffice">
        <div class="workout-page">

            <!-- Loading -->
            <div v-if="state === 'loading'" class="workout-skeleton" :aria-label="$t('workout.loading')">
                <skeleton-block :rows="1" height="2.2rem" />
                <div class="sk-card"><skeleton-block :rows="1" height="9rem" /><skeleton-block :rows="3" height="1.3rem" /><skeleton-block :rows="1" height="3.2rem" /></div>
                <div class="sk-card"><skeleton-block :rows="4" height="1.1rem" /></div>
            </div>

            <!-- Done -->
            <div v-else-if="state === 'done'" class="done-state">
                <div class="done-hero">
                    <div class="done-icon">🏆</div>
                    <h1>{{ $t('workout.done.title') }}</h1>
                    <p class="done-subtitle">{{ $t('workout.done.subtitle') }}</p>
                    <div class="done-duration" v-if="workoutDuration">⏱ {{ workoutDuration }}</div>
                    <div class="done-duration" v-if="workoutKcal">🔥 {{ workoutKcal }}</div>
                    <div class="kcal-note" v-if="workoutKcal">{{ $t('energy.short') }}</div>
                </div>

                <div class="done-summary" v-if="completedExercises.length">
                    <div class="done-summary-title">{{ $t('workout.done.summary') }}</div>
                    <template v-for="(ex, exI) in completedExercises" :key="exI">
                        <div class="done-exercise" v-if="ex.sets.length">
                            <div class="done-ex-name">{{ ex.name }}</div>
                            <div class="done-ex-sets">
                                <span v-for="(s, i) in ex.sets" :key="i" class="done-set-pill" :class="{ failed: s.is_failed, dropset: s.is_dropset }">
                                    {{ s.reps }} × {{ s.weight > 0 ? s.weight + ' kg' : $t('workout.log.bodyweightShort') }}
                                </span>
                            </div>
                        </div>
                    </template>
                </div>

                <div class="wk-extra" v-if="stretchHabit">
                    <div class="wk-extra-title">{{ $t('recommendation.workout.stretchTitle') }}</div>
                    <div class="wk-extra-text">{{ $t('recommendation.workout.stretchText') }}</div>
                    <span v-if="stretchHabit.log?.completed" class="wk-pill">✓ {{ $t('recommendation.workout.warmupDone') }}</span>
                    <button v-else class="wk-extra-btn" @click="markHabit('stretch')">{{ $t('recommendation.workout.warmupMark') }}</button>
                </div>

                <div class="wk-extra" v-if="!workout?.feedback">
                    <div class="wk-extra-title">{{ $t('recommendation.workout.feedbackTitle') }}</div>
                    <p class="wk-extra-text" v-if="feedbackGiven">{{ $t('recommendation.workout.feedbackThanks') }}</p>
                    <div class="wk-feedback" v-else>
                        <button class="wk-extra-btn" @click="sendFeedback('hard')">{{ $t('recommendation.workout.hard') }}</button>
                        <button class="wk-extra-btn" @click="sendFeedback('ok')">{{ $t('recommendation.workout.ok') }}</button>
                        <button class="wk-extra-btn" @click="sendFeedback('easy')">{{ $t('recommendation.workout.easy') }}</button>
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

                <!-- STATE: abs-offer (optional abdominals before closing a routine workout) -->
                <div v-if="state === 'abs-offer'" class="action-block pick-exercise-block">
                    <p class="action-label">{{ $t('workout.abs.question') }}</p>
                    <p class="pending-sub">{{ $t('workout.abs.sub') }}</p>
                    <div class="pending-modal-list">
                        <button v-for="ex in absOptions" :key="ex.id" class="pending-row" :disabled="addingExercise" @click="chooseAbs(ex)">
                            <span>{{ ex.name }}</span>
                            <small v-if="ex.equipment">{{ ex.equipment.name }}</small>
                        </button>
                    </div>
                    <button class="btn-action skip" @click="finishRoutine()">{{ $t('workout.abs.skip') }}</button>
                </div>

                <!-- STATE: pick-exercise -->
                <div v-if="state === 'pick-exercise'" class="action-block pick-exercise-block">
                    <p class="action-label">{{ $t('workout.pick.question') }}</p>
                    <div class="exercise-search-wrap">
                        <SearchInput
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

                <!-- Exercise card + acció (unificats) -->
                <div class="exercise-card" v-if="currentExercise && state !== 'pick-exercise'">

                    <!-- Info exercici -->
                    <exercise-animation class="exercise-gif" :exercise="currentExercise.exercise" />
                    <a class="exercise-name exercise-link" :href="'/exercise/' + currentExercise.exercise?.id" @click.prevent="to('/exercise/' + currentExercise.exercise?.id)">{{ currentExercise.exercise?.name }}</a>
                    <div class="exercise-eq" v-if="currentExercise.exercise?.equipment">
                        {{ currentExercise.exercise.equipment.name }}
                    </div>

                    <!-- Variant: how this exercise is done today (comparisons only use the same variant) -->
                    <div class="variant-row" v-if="canPickVariant">
                        <span class="variant-label">{{ $t('workout.variant.label') }}</span>
                        <button type="button" class="variant-chip" :class="{ active: !currentExercise.variant }" @click="setVariant(null)">{{ $t('workout.variant.usual') }}</button>
                        <button v-for="v in variantOptions" :key="v" type="button" class="variant-chip" :class="{ active: currentExercise.variant === v }" @click="setVariant(v)">{{ v }}</button>
                        <button v-if="!addingVariant" type="button" class="variant-chip add" @click="addingVariant = true">+ {{ $t('workout.variant.new') }}</button>
                    </div>
                    <form class="variant-add" v-if="canPickVariant && addingVariant" @submit.prevent="addVariant()">
                        <input type="text" maxlength="60" v-model="newVariant" :placeholder="$t('workout.variant.placeholder')" />
                        <button type="submit" class="variant-chip active">✓</button>
                        <button type="button" class="variant-chip" @click="addingVariant = false">✕</button>
                    </form>
                    <div class="variant-current" v-else-if="currentExercise.variant">{{ $t('workout.variant.label') }} {{ currentExercise.variant }}</div>
                    <div class="set-info" v-if="totalSets > 0 && doneCount < totalSets">
                        {{ $t('workout.card.setOf', { current: doneCount + 1, total: totalSets }) }}
                    </div>
                    <div class="set-info" v-else-if="totalSets > 0 && (state === 'resting' || state === 'choose')">
                        {{ $t('workout.card.plannedDone') }}
                    </div>
                    <div class="set-info" v-else-if="totalSets > 0">
                        {{ $t('workout.card.extraSet', { current: doneCount + 1 }) }}
                    </div>
                    <div class="set-info" v-else>
                        {{ $t('workout.card.set', { current: doneCount + 1 }) }}
                    </div>
                    <div class="target-hint" v-if="targetSet">
                        {{ $t('workout.card.target') }}: {{ targetSet.reps_target ?? targetSet.reps }} {{ $t('workout.history.reps') }}<template v-if="targetSet.weight > 0"> · {{ targetSet.weight }} kg</template><template v-if="targetRestLabel"> · {{ targetRestLabel }}</template>
                    </div>

                    <div class="last-time" v-if="lastTimeLabel && (state === 'idle' || state === 'active')">
                        {{ lastTimeLabel }}
                        <div class="last-time-note" v-if="lastTimeNote">💬 {{ lastTimeNote }}</div>
                    </div>

                    <div class="wk-extra" v-if="showGeneralWarmup">
                        <div class="wk-extra-title">{{ $t('recommendation.workout.warmupTitle') }}</div>
                        <div class="wk-extra-text">{{ $t('recommendation.workout.warmupText') }}</div>
                        <button class="wk-extra-btn" @click="markHabit('warmup')">{{ $t('recommendation.workout.warmupMark') }}</button>
                    </div>

                    <div class="wk-extra" v-if="warmupSets.length">
                        <div class="wk-extra-title">{{ $t('recommendation.workout.warmupSets') }}</div>
                        <div class="wk-extra-text">{{ $t('recommendation.workout.warmupSetsText') }}</div>
                        <div class="wk-warmup-sets">
                            <span v-for="(w, i) in warmupSets" :key="i" class="wk-pill">{{ w.reps }} × {{ w.weight }} kg</span>
                        </div>
                    </div>

                    <div class="card-divider"></div>

                    <!-- STATE: idle -->
                    <template v-if="state === 'idle'">
                            <button class="btn-action start" @click="startSet()">{{ $t('workout.card.start') }}</button>
                            <SectionTile v-if="canAdd && addSuggestions.length" v-model:open="showPending"
                                :title="$t('workout.pending.title')" :status="String(addSuggestions.length)" tone="pending">
                                <p class="pending-sub">{{ $t('workout.pending.sub') }}</p>
                                <div class="pending-modal-list">
                                    <button v-for="p in addSuggestions" :key="p.exercise_id" class="pending-row"
                                        :disabled="addingExercise" @click="addExercise(p.exercise)">
                                        <span>{{ p.exercise.name }}</span>
                                        <small v-if="p.day_name">{{ p.day_name }} · {{ pendingWhen(p.date) }}</small>
                                    </button>
                                </div>
                            </SectionTile>
                            <div class="idle-links" v-if="canFinishEarly">
                                <button class="btn-finish" @click="finishExerciseEarly()">{{ $t('workout.finishEarly', { done: doneCount }) }}</button>
                            </div>
                            <div class="idle-links" v-if="canAdd">
                                <button v-if="canReshuffle" class="link-btn danger" @click="skipExercise()">{{ $t('workout.skip.button') }}</button>
                            </div>
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
                        <!-- .log-form gives the field and its +/- buttons the style they have when logging a set -->
                        <div class="log-form" v-if="nextWeight !== null">
                            <div class="log-field">
                                <label>{{ $t('workout.rest.nextWeight') }}</label>
                                <div class="number-input">
                                    <button @click="nextWeight = Math.max(0, Number(nextWeight) - 2.5)">−</button>
                                    <input type="number" v-model.number="nextWeight" min="0" step="0.5" />
                                    <button @click="nextWeight = Number(nextWeight) + 2.5">+</button>
                                </div>
                            </div>
                        </div>
                        <button class="btn-action skip" @click="skipRest()">{{ $t('workout.rest.skip') }}</button>
                        <div class="idle-links" v-if="canFinishEarly">
                            <button class="btn-finish" @click="finishExerciseEarly()">{{ $t('workout.finishEarly', { done: doneCount }) }}</button>
                        </div>
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
                            <span class="progress-ex-name exercise-link" @click="to('/exercise/' + ex.exercise?.id)">{{ ex.exercise?.name }}<span class="muscle-label" v-if="muscleLabel(ex.exercise)"> ({{ muscleLabel(ex.exercise) }})</span></span>
                            <span class="progress-ex-badge done" v-if="exIdx < currentExerciseIdx">✓</span>
                            <span class="progress-ex-badge current" v-else-if="exIdx === currentExerciseIdx">{{ $t('workout.progress.current') }}</span>
                            <button v-else-if="canReshuffle" class="progress-ex-go" @click="startWith(exIdx)">{{ $t('workout.plan.startWith') }}</button>
                        </div>

                        <div class="sets-table">
                            <div class="set-row set-head">
                            <span>#</span>
                            <span>{{ $t('workout.progress.reps') }}</span>
                            <span>{{ $t('workout.progress.weight') }}</span>
                            <span>{{ $t('workout.progress.notes') }}</span>
                        </div>
                            

                                <!-- Exercici passat o actual: sèries fetes, editables i eliminables -->
                                <template v-if="exIdx <= currentExerciseIdx">
                                    <template v-for="(s, i) in setRows(exIdx)" :key="'done-' + (s.id ?? i)">
                                    <div v-if="editing?.set === s" class="set-row set-row-editing">
                                        <div class="edit-form-cell">
                                            <div class="edit-form-title">{{ $t('workout.editSet.title', { n: s.set_number ?? i + 1 }) }}</div>
                                            <div class="edit-grid">
                                                <label>{{ $t('workout.progress.reps') }}<input type="number" inputmode="numeric" v-model.number="editing.reps" min="1" class="cell-input" /></label>
                                                <label v-if="!editingBodyweight">{{ $t('workout.progress.weight') }} (kg)<input type="number" inputmode="decimal" v-model.number="editing.weight" min="0" step="0.5" class="cell-input" /></label>
                                                <label>{{ $t('workout.editSet.rest') }}<input type="number" inputmode="numeric" v-model.number="editing.rest" min="0" class="cell-input" /></label>
                                                <label>{{ $t('workout.editSet.duration') }}<input type="number" inputmode="numeric" v-model.number="editing.duration" min="0" class="cell-input" /></label>
                                            </div>
                                            <input type="text" v-model="editing.notes" class="cell-input wide" :placeholder="$t('workout.log.notesPlaceholder')" />
                                            <div class="flag-row">
                                                <button type="button" class="flag-chip failed" :class="{ active: editing.failed }" @click="editing.failed = !editing.failed">✕ {{ $t('workout.log.failed') }}</button>
                                                <button type="button" class="flag-chip dropset" :class="{ active: editing.dropset }" @click="editing.dropset = !editing.dropset">↓ {{ $t('workout.log.dropset') }}</button>
                                            </div>
                                            <div class="edit-actions">
                                                <button type="button" class="edit-btn" :disabled="savingEdit" @click="closeEdit()">{{ $t('workout.editSet.cancel') }}</button>
                                                <button type="button" class="edit-btn primary" :disabled="savingEdit" @click="saveEdit()">{{ $t('workout.editSet.save') }}</button>
                                            </div>
                                        </div>
                                    </div>
                                    <SwipeRow v-else @edit="openEdit(exIdx, s)" @delete="deleteSet(exIdx, s)">
                                        <div class="set-row set-row-done">
                                        <span>{{ s.set_number ?? i + 1 }}</span>
                                        <span>{{ s.reps }} <small class="cmp">{{ compareText(s.reps, prevFor(i, setRows(exIdx), ex.exercise?.id, ex.variant)?.reps) }}</small></span>
                                        <span>{{ s.weight > 0 ? s.weight + ' kg' : $t('workout.log.bodyweightShort') }} <small class="cmp" v-if="s.weight > 0 || prevFor(i, setRows(exIdx), ex.exercise?.id, ex.variant)?.weight > 0">{{ compareText(s.weight, prevFor(i, setRows(exIdx), ex.exercise?.id, ex.variant)?.weight, ' kg') }}</small></span>
                                        <span class="note-cell" @click="openNote($event, s.notes)">{{ s.notes || '—' }}</span>
                                    </div>
                                    </SwipeRow>
                                    </template>

                                    <!-- Sèrie nova (afegida a mà) -->
                                    <div v-if="editing?.isNew && editing.exIdx === exIdx" class="set-row set-row-editing">
                                        <div class="edit-form-cell">
                                            <div class="edit-form-title">{{ $t('workout.editSet.title', { n: setRows(exIdx).length + 1 }) }}</div>
                                            <div class="edit-grid">
                                                <label>{{ $t('workout.progress.reps') }}<input type="number" inputmode="numeric" v-model.number="editing.reps" min="1" class="cell-input" /></label>
                                                <label v-if="!editingBodyweight">{{ $t('workout.progress.weight') }} (kg)<input type="number" inputmode="decimal" v-model.number="editing.weight" min="0" step="0.5" class="cell-input" /></label>
                                                <label>{{ $t('workout.editSet.rest') }}<input type="number" inputmode="numeric" v-model.number="editing.rest" min="0" class="cell-input" /></label>
                                                <label>{{ $t('workout.editSet.duration') }}<input type="number" inputmode="numeric" v-model.number="editing.duration" min="0" class="cell-input" /></label>
                                            </div>
                                            <input type="text" v-model="editing.notes" class="cell-input wide" :placeholder="$t('workout.log.notesPlaceholder')" />
                                            <div class="flag-row">
                                                <button type="button" class="flag-chip failed" :class="{ active: editing.failed }" @click="editing.failed = !editing.failed">✕ {{ $t('workout.log.failed') }}</button>
                                                <button type="button" class="flag-chip dropset" :class="{ active: editing.dropset }" @click="editing.dropset = !editing.dropset">↓ {{ $t('workout.log.dropset') }}</button>
                                            </div>
                                            <div class="edit-actions">
                                                <button type="button" class="edit-btn" :disabled="savingEdit" @click="closeEdit()">{{ $t('workout.editSet.cancel') }}</button>
                                                <button type="button" class="edit-btn primary" :disabled="savingEdit" @click="saveEdit()">{{ $t('workout.editSet.save') }}</button>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Exercici actual: fila live i sèries pendents -->
                                    <template v-if="exIdx === currentExerciseIdx">
                                        <div v-if="state === 'logging'" class="set-row set-row-live">
                                            <span>{{ doneCount + 1 }}</span>
                                            <span>{{ logReps }} <small class="cmp">{{ compareText(logReps, prevFor(doneCount, loggedSets)?.reps) }}</small></span>
                                            <span>{{ isBodyweight ? $t('workout.log.bodyweightShort') : (logWeight + ' kg') }} <small class="cmp" v-if="!isBodyweight">{{ compareText(logWeight, prevFor(doneCount, loggedSets)?.weight, ' kg') }}</small></span>
                                            <span>{{ logNotes || '—' }}</span>
                                        </div>

                                        <template v-if="totalSets > 0">
                                            <div
                                                v-for="(s, i) in currentExercise.sets.slice(doneCount + (state === 'logging' ? 1 : 0))"
                                                :key="'pend-' + i"
                                                class="set-row set-row-pending"
                                            >
                                                <span>{{ doneCount + (state === 'logging' ? 1 : 0) + i + 1 }}</span>
                                                <span><span class="plan-val">{{ s.reps_target ?? s.reps }}</span></span>
                                                <span><span class="plan-val">{{ s.weight > 0 ? s.weight + ' kg' : $t('workout.log.bodyweightShort') }}</span></span>
                                                <span><span class="plan-val">—</span></span>
                                            </div>
                                        </template>

                                        <div v-if="loggedSets.length === 0 && state !== 'logging' && totalSets <= 0" class="set-row set-row-empty">
                                            <div class="span-all">{{ $t('workout.progress.noSetsYet') }}</div>
                                        </div>
                                    </template>
                                    <div v-else-if="!setRows(exIdx).length && !editing?.isNew" class="set-row set-row-empty">
                                        <div class="span-all">{{ $t('workout.progress.noSetsLogged') }}</div>
                                    </div>

                                    <div v-if="canAddSet(exIdx) && !editing?.isNew" class="set-row set-row-add">
                                        <div class="span-all"><button type="button" class="add-set-btn" @click="openAddSet(exIdx)">+ {{ $t('workout.editSet.add') }}</button></div>
                                    </div>
                                </template>

                                <!-- Exercici futur: mostrar pla si en té -->
                                <template v-else>
                                    <template v-if="ex.sets && ex.sets.length > 0">
                                        <div v-for="(s, i) in ex.sets" :key="s.id ?? i" class="set-row set-row-future">
                                            <span>{{ i + 1 }}</span>
                                            <span><span class="plan-val">{{ s.reps_target ?? s.reps }}</span></span>
                                            <span><span class="plan-val">{{ s.weight > 0 ? s.weight + ' kg' : $t('workout.log.bodyweightShort') }}</span></span>
                                            <span><span class="plan-val">—</span></span>
                                        </div>
                                    </template>
                                    <div v-else class="set-row set-row-empty">
                                        <div class="span-all">{{ $t('workout.progress.pending') }}</div>
                                    </div>
                                </template>

                            
                        </div>
                    </div>
                </div>

                <!-- Exercicis descartats avui: continuen a la llista i es poden recuperar -->
                <div class="workout-progress skipped-list" v-if="skippedNow.length && state !== 'done'">
                    <div v-for="sk in skippedNow" :key="sk.exercise_id" class="progress-exercise ex-skipped">
                        <div class="progress-ex-header">
                            <span class="progress-ex-name">{{ sk.exercise?.name }}<span class="muscle-label" v-if="muscleLabel(sk.exercise)"> ({{ muscleLabel(sk.exercise) }})</span></span>
                            <button v-if="canAdd" class="progress-ex-go" :disabled="addingExercise" @click="restoreSkipped(sk)">{{ $t('workout.skip.restore') }}</button>
                            <span v-else class="progress-ex-badge skipped">{{ $t('workout.skip.skipped') }}</span>
                        </div>
                    </div>
                </div>

                <!-- Full note when it does not fit in the table cell -->
                <div v-if="noteText" class="modal-overlay" @click="noteText = ''">
                    <div class="modal note-modal">
                        <p>{{ noteText }}</p>
                    </div>
                </div>

                <!-- Afegir exercici (a sota del progrés) -->
                <div class="idle-links" v-if="canAdd && !showAdd">
                    <button class="link-btn" @click="openAdd()">{{ $t('workout.add.button') }}</button>
                </div>
                <div v-if="canAdd && showAdd" class="action-block pick-exercise-block">
                        <p class="action-label">{{ $t('workout.add.title') }}</p>

                        <div class="exercise-search-wrap">
                            <SearchInput v-model="exerciseQuery"
                                :placeholder="$t('workout.pick.searchPlaceholder')" @input="filterExercises()" />
                            <div class="exercise-dropdown" v-if="exerciseResults.length">
                                <div v-for="ex in exerciseResults" :key="ex.id" class="exercise-dropdown-item"
                                    @mousedown="addExercise(ex)">
                                    <span>{{ ex.name }}</span>
                                    <small v-if="ex.equipment">{{ ex.equipment.name }}</small>
                                </div>
                            </div>
                        </div>
                        <div v-if="addingExercise" class="loading-text">{{ $t('workout.pick.adding') }}</div>
                        <button class="btn-action skip" @click="closeAdd()">{{ $t('workout.add.cancel') }}</button>
                    </div>



            </div>

        </div>
    </AppPage>
</template>

<script lang="ts" src="./workout.ts"></script>
<style lang="scss" src="./workout.scss"></style>
