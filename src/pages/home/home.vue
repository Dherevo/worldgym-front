<template>
    <AppPage name="home-page" layout="backoffice">
        <div class="home-page">

            <!-- Active workout banner -->
            <div class="active-workout-banner" v-if="activeWorkout">
                <div class="active-info">
                    <span class="active-dot"></span>
                    <span>{{ $t('home.activeWorkout.banner') }}</span>
                </div>
                <button @click="to(activeWorkout.circuit ? `/circuit/${activeWorkout.circuit.routine_id}/${activeWorkout.circuit.day_id}` : '/workout/' + activeWorkout.id)">{{ $t('home.activeWorkout.resume') }}</button>
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
            <template v-if="!restMode && !activeWorkout">
            <div class="today-card" v-if="loadingRoutine">
                <skeleton-block :rows="1" height="1.2rem" />
                <skeleton-block :rows="2" height="1.6rem" />
                <skeleton-block :rows="1" height="3rem" />
            </div>

            <div class="today-card" v-else-if="activeRoutines.length === 1">
                <div class="today-info">
                    <div class="routine-name">{{ defaultRoutine.name }}</div>
                    <div class="week-mini" v-if="weekOf(defaultRoutine.id) && weekOf(defaultRoutine.id).total > 1">
                        <div class="week-text">{{ $t('home.week.mini', { done: weekOf(defaultRoutine.id).done, total: weekOf(defaultRoutine.id).total }) }}</div>
                        <div class="week-bar">
                            <span v-for="n in weekOf(defaultRoutine.id).total" :key="n" class="seg" :class="{ filled: n <= weekOf(defaultRoutine.id).done }" :style="{ transitionDelay: (n * 90) + 'ms' }"></span>
                        </div>
                    </div>
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
                    <button class="btn-other-routine" @click="dayPickerEntry = activeRoutines[0]" v-if="(defaultRoutine.days?.length ?? 0) > 1">
                        {{ $t('home.routine.chooseDay') }}
                    </button>
                    <button class="btn-other-routine" @click="openRoutinePicker()" v-if="otherRoutines.length">
                        {{ $t('home.routine.otherRoutine') }}
                    </button>
                    <button class="btn-other-routine" @click="to('/recommendation')">{{ $t('recommendation.homeCard.title') }}</button>
                    <div class="free-zone"><button class="btn-free" @click="startEmptyWorkout()">{{ $t('home.routine.freeWorkout') }}</button></div>
                </div>
            </div>

            <div class="today-card multi" v-else-if="activeRoutines.length > 1">
                <div class="multi-title">{{ $t('home.routine.startYours') }}</div>
                <div class="multi-item" v-for="e in activeRoutines" :key="e.routine.id">
                    <div class="today-info">
                        <div class="routine-name">{{ e.routine.name }}</div>
                        <div class="week-mini" v-if="weekOf(e.routine.id) && weekOf(e.routine.id).total > 1">
                        <div class="week-text">{{ $t('home.week.mini', { done: weekOf(e.routine.id).done, total: weekOf(e.routine.id).total }) }}</div>
                        <div class="week-bar">
                            <span v-for="n in weekOf(e.routine.id).total" :key="n" class="seg" :class="{ filled: n <= weekOf(e.routine.id).done }" :style="{ transitionDelay: (n * 90) + 'ms' }"></span>
                        </div>
                    </div>
                        <div class="day-name">{{ e.nextDay?.name }}</div>
                    </div>
                    <div class="start-actions">
                        <button class="btn-start" @click="startDay(e.nextDay, e)" :disabled="starting">
                            {{ starting ? $t('home.routine.starting') : $t('home.routine.start') }}
                        </button>
                        <button class="btn-other-routine" @click="dayPickerEntry = e" v-if="(e.routine.days?.length ?? 0) > 1">
                            {{ $t('home.routine.chooseDay') }}
                        </button>
                    </div>
                </div>
                <div class="multi-extra">
                    <button class="btn-other-routine" @click="openRoutinePicker()" v-if="otherRoutines.length">{{ $t('home.routine.otherRoutine') }}</button>
                    <button class="btn-other-routine" @click="to('/recommendation')">{{ $t('recommendation.homeCard.title') }}</button>
                </div>
                <div class="free-zone"><button class="btn-free" @click="startEmptyWorkout()">{{ $t('home.routine.freeWorkout') }}</button></div>
            </div>

            <div class="today-card no-routine" v-else-if="!loadingRoutine">
                <p>{{ $t('home.routine.noDefault') }}</p>
                <button class="btn-start wide" @click="startEmptyWorkout()">{{ $t('home.routine.freeWorkout') }}</button>
                <div class="actions-row two">
                    <button class="btn-secondary" @click="to('/routines')">{{ $t('home.routine.manage') }}</button>
                    <button class="btn-secondary" @click="to('/recommendation')">{{ $t('recommendation.homeCard.title') }}</button>
                </div>
            </div>

            </template>

            <!-- Daily must-dos (steps, abs...) -->
            <!-- How the user feels today: feeds the recommended session -->
            <CheckIn compact />

            <!-- Calories eaten against the ones burned today -->
            <div class="energy-home" v-if="energy?.ready" @click="to('/nutrition')">
                <div class="energy-home-title">{{ $t('nutrition.homeTitle') }} <span>›</span></div>
                <EnergyBar :day="energy" />
            </div>

            <DailyHabits :restDay="restMode" />

            <!-- Workout history -->
            <button type="button" class="history-link" @click="to('/workouts')">
                {{ $t('home.historyBtn') }}
                <svg-icon class="hl-go" name="heroicons-outline/chevron-right" />
            </button>

            <!-- Day picker modal (days of the default routine) -->
            <div v-if="dayPickerEntry" class="modal-overlay" @click.self="dayPickerEntry = null">
                <div class="modal">
                    <h3>{{ $t('home.dayPicker.title') }}</h3>
                    <div class="picker-list">
                        <div
                            v-for="d in dayPickerEntry.routine.days"
                            :key="d.id"
                            class="picker-item"
                            :class="{ selected: dayPickerEntry.nextDay?.id === d.id }"
                            @click="startDay(d, dayPickerEntry); dayPickerEntry = null"
                        >
                            <div class="picker-name">
                                {{ d.name }}
                                <span v-if="dayPickerEntry.doneDayIds.includes(d.id)" class="picker-done">✓ {{ $t('home.dayPicker.done') }}</span>
                                <span v-else-if="dayPickerEntry.nextDay?.id === d.id" class="picker-done">{{ $t('home.dayPicker.suggested') }}</span>
                            </div>
                        </div>
                    </div>
                    <div class="modal-actions">
                        <button class="btn-cancel" @click="dayPickerEntry = null">{{ $t('home.picker.cancel') }}</button>
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
