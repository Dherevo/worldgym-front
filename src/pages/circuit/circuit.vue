<template>
    <AppPage name="circuit-page" layout="backoffice">
        <div class="circuit-page">

            <div v-if="state === 'loading'" class="center-state">
                <div class="loading-text">{{ $t('circuit.loading') }}</div>
            </div>

            <div v-else-if="state === 'unavailable'" class="center-state">
                <p>{{ $t('circuit.unavailable') }}</p>
                <button type="button" class="c-link" @click="to(`/routines/${routineId}`)">{{ $t('circuit.back') }}</button>
            </div>

            <!-- Before starting: what will be done -->
            <div v-else-if="state === 'ready'" class="c-card">
                <button type="button" class="c-link" @click="to(`/routines/${routineId}`)">{{ $t('circuit.back') }}</button>
                <h1>{{ day.name }}</h1>
                <p class="c-big-minutes">{{ $t('circuit.minutes', { n: day.circuit_minutes }) }}</p>
                <ol class="c-list">
                    <li v-for="ex in exercises" :key="ex.id"><span>{{ ex.exercise?.name }}</span><strong>× {{ ex.reps_target }}</strong></li>
                </ol>
                <p class="c-hint">{{ $t('circuit.hint') }}</p>
                <button type="button" class="c-btn" @click="start()">{{ $t('circuit.start') }}</button>
            </div>

            <!-- Running: countdown, the exercise to do now and one button -->
            <div v-else-if="state === 'running'" class="c-card running">
                <div class="c-timer" :class="{ low: remainingSeconds <= 30 }">{{ timeLabel }}</div>
                <div class="c-round">{{ $t('circuit.round', { n: round }) }} · {{ $t('circuit.step', { i: stepInRound + 1, n: exercises.length }) }}</div>
                <div class="c-now">
                    <div class="c-now-name">{{ current?.exercise?.name }}</div>
                    <div class="c-now-reps">× {{ current?.reps_target }}</div>
                </div>
                <button type="button" class="c-btn done" @click="done()">{{ $t('circuit.done') }}</button>
                <div class="c-next" v-if="next">{{ $t('circuit.next', { name: next.exercise?.name }) }}</div>
                <div class="c-stats">{{ $t('circuit.roundsDone', { n: completedRounds }) }}</div>
                <div class="c-links">
                    <button type="button" class="c-link" :disabled="!log.length" @click="undo()">{{ $t('circuit.undo') }}</button>
                    <button type="button" class="c-link" @click="finishEarly()">{{ $t('circuit.finishNow') }}</button>
                </div>
            </div>

            <div v-else-if="state === 'saving'" class="center-state">
                <div class="loading-text">{{ $t('circuit.saving') }}</div>
            </div>

            <div v-else-if="state === 'saveError'" class="center-state">
                <p>{{ $t('circuit.errors.save') }}</p>
                <button type="button" class="c-btn" @click="retrySave()">{{ $t('circuit.retry') }}</button>
            </div>

            <!-- Summary -->
            <div v-else-if="state === 'done'" class="c-card">
                <h1>{{ $t('circuit.finished') }}</h1>
                <p class="c-big-minutes">{{ $t('circuit.roundsTotal', { n: completedRounds }) }}</p>
                <p class="c-hint" v-if="stepInRound > 0">{{ $t('circuit.extra', { n: stepInRound }) }}</p>
                <ul class="c-list">
                    <li v-for="t in totals" :key="t.exercise.id"><span>{{ t.exercise.exercise?.name }}</span><strong>{{ t.reps }} {{ $t('circuit.repsShort') }}</strong></li>
                </ul>
                <p class="c-hint">{{ $t('circuit.time', { t: durationLabel(elapsedSeconds) }) }}</p>
                <button type="button" class="c-btn" @click="to('/workouts')">{{ $t('circuit.toHistory') }}</button>
            </div>

        </div>
    </AppPage>
</template>

<script lang="ts" src="./circuit.ts"></script>
<style lang="scss" src="./circuit.scss"></style>
