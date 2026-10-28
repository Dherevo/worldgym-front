<template>
    <AppPage name="home-page" layout="backoffice">
        <div class="home-page">

            <!-- Active workout banner -->
            <div class="active-workout-banner" v-if="activeWorkout">
                <div class="active-info">
                    <span class="active-dot"></span>
                    <span>{{ $t('home.activeWorkout.banner') }}</span>
                </div>
                <button @click="to('/workout/' + activeWorkout.id)">{{ $t('home.activeWorkout.resume') }}</button>
            </div>

            <!-- Week progress -->
            <div class="week-strip" v-if="week && week.routine_days_total">
                <div class="week-dots">
                    <span v-for="n in week.routine_days_total" :key="n" class="dot" :class="{ filled: n <= week.days_done }"></span>
                </div>
                <div class="week-text">
                    {{ $t('home.week.label', { done: week.days_done, total: week.routine_days_total }) }}
                    <span v-if="weekBehind" class="week-hint">· {{ $t('home.week.behind', { total: week.routine_days_total }) }}</span>
                </div>
            </div>

            <!-- Rest day -->
            <div class="rest-card" v-if="restMode">
                <div>
                    <div class="rest-title">{{ week.week_complete ? $t('home.week.complete') : $t('home.week.trained') }}</div>
                    <div class="rest-sub">{{ week.week_complete ? $t('home.week.restSub') : $t('home.week.restSubTrained') }}</div>
                </div>
                <button class="btn-train-anyway" @click="forceTrain = true">{{ $t('home.week.trainAnyway') }}</button>
            </div>

            <!-- Routine card -->
            <template v-if="!restMode">
            <div class="today-card" v-if="loadingRoutine">
                <div class="loading-text">{{ $t('home.routine.loading') }}</div>
            </div>

            <div class="today-card" v-else-if="defaultRoutine && nextDay">
                <div class="today-info">
                    <div class="routine-name">{{ defaultRoutine.name }}</div>
                    <div class="today-label">{{ $t('home.routine.todayLabel') }}</div>
                    <div class="day-name">{{ nextDay.name }}</div>
                    <div class="exercises-preview" v-if="nextDay.exercises?.length">
                        <span v-for="(ex, i) in nextDay.exercises" :key="ex.id">
                            {{ ex.exercise?.name }}<span v-if="i < nextDay.exercises.length - 1"> · </span>
                        </span>
                    </div>
                </div>
                <div class="start-actions">
                    <button class="btn-start" @click="startNextDay()" :disabled="starting">
                        {{ starting ? $t('home.routine.starting') : $t('home.routine.start') }}
                    </button>
                    <button class="btn-other-routine" @click="openRoutinePicker()" v-if="otherRoutines.length">
                        {{ $t('home.routine.otherRoutine') }}
                    </button>
                    <button class="btn-free" @click="startEmptyWorkout()">{{ $t('home.routine.freeWorkout') }}</button>
                </div>
            </div>

            <div class="today-card no-routine" v-else-if="!loadingRoutine">
                <p>{{ $t('home.routine.noDefault') }}</p>
                <div class="actions-row">
                    <button class="btn-secondary" @click="to('/routines')">{{ $t('home.routine.manage') }}</button>
                    <button class="btn-start" @click="startEmptyWorkout()">{{ $t('home.routine.freeWorkout') }}</button>
                </div>
            </div>

            </template>

            <!-- Daily must-dos (steps, abs...) -->
            <DailyHabits :restDay="restMode" />

            <!-- Quick access -->
            <div class="quick-access">
                <div class="quick-card" @click="to('/routines')">{{ $t('home.quickAccess.routines') }}</div>
                <div class="quick-card" @click="to('/exercises')">{{ $t('home.quickAccess.exercises') }}</div>
                <div class="quick-card" @click="to('/workouts')">{{ $t('home.quickAccess.history') }}</div>
                <div class="quick-card" @click="startEmptyWorkout()">{{ $t('home.quickAccess.freeWorkout') }}</div>
            </div>

            <!-- Recent workouts -->
            <div class="section">
                <h2>{{ $t('home.recent.title') }}</h2>
                <div v-if="loadingWorkouts" class="loading-text">{{ $t('home.recent.loading') }}</div>
                <div v-else-if="recentWorkouts.length === 0" class="empty-text">{{ $t('home.recent.empty') }}</div>
                <div v-else class="workout-list">
                    <div v-for="w in recentWorkouts" :key="w.id" class="workout-card" @click="to('/workouts/' + w.id)">
                        <div>
                            <div class="workout-date">{{ formatDate(w.date) }}</div>
                            <div class="workout-notes">{{ w.notes || $t('home.recent.noNotes') }}</div>
                        </div>
                        <span>&rsaquo;</span>
                    </div>
                </div>
            </div>

            <!-- Routine picker modal -->
            <div v-if="showRoutinePicker" class="modal-overlay" @click.self="showRoutinePicker = false">
                <div class="modal">
                    <h3>{{ $t('home.picker.title') }}</h3>
                    <div class="picker-list">
                        <div
                            v-for="r in otherRoutines"
                            :key="r.id"
                            class="picker-item"
                            :class="{ selected: pickerRoutine?.id === r.id }"
                            @click="selectPickerRoutine(r)"
                        >
                            <div class="picker-name">{{ r.name }}</div>
                            <div class="picker-day" v-if="pickerRoutine?.id === r.id">
                                <span v-if="loadingPickerDay" class="loading-text">{{ $t('home.picker.loading') }}</span>
                                <span v-else-if="pickerNextDay">{{ $t('home.picker.next') }} <b>{{ pickerNextDay.name }}</b></span>
                            </div>
                        </div>
                    </div>
                    <div class="modal-actions">
                        <button class="btn-cancel" @click="showRoutinePicker = false">{{ $t('home.picker.cancel') }}</button>
                        <button
                            class="btn-save"
                            @click="startPickerRoutine()"
                            :disabled="!pickerNextDay || startingPicker"
                        >
                            {{ startingPicker ? $t('home.picker.starting') : $t('home.picker.start') }}
                        </button>
                    </div>
                </div>
            </div>

        </div>
    </AppPage>
</template>

<script lang="ts" src="./home.ts"></script>
<style lang="scss" src="./home.scss"></style>
