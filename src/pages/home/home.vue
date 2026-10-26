<template>
    <AppPage name="home-page" layout="backoffice">
        <div class="home-page">

            <!-- Active workout banner -->
            <div class="active-workout-banner" v-if="activeWorkout">
                <div class="active-info">
                    <span class="active-dot"></span>
                    <span>Tens un entrenament en curs</span>
                </div>
                <button @click="to('/workout/' + activeWorkout.id)">Reprendre →</button>
            </div>

            <!-- Routine card -->
            <div class="today-card" v-if="loadingRoutine">
                <div class="loading-text">Carregant rutina...</div>
            </div>

            <div class="today-card" v-else-if="defaultRoutine && nextDay">
                <div class="today-info">
                    <div class="routine-name">{{ defaultRoutine.name }}</div>
                    <div class="today-label">Avui et toca:</div>
                    <div class="day-name">{{ nextDay.name }}</div>
                    <div class="exercises-preview" v-if="nextDay.exercises?.length">
                        <span v-for="(ex, i) in nextDay.exercises" :key="ex.id">
                            {{ ex.exercise?.name }}<span v-if="i < nextDay.exercises.length - 1"> · </span>
                        </span>
                    </div>
                </div>
                <div class="start-actions">
                    <button class="btn-start" @click="startNextDay()" :disabled="starting">
                        {{ starting ? 'Iniciant...' : 'Començar' }}
                    </button>
                    <button class="btn-other-routine" @click="openRoutinePicker()" v-if="otherRoutines.length">
                        Altra rutina
                    </button>
                    <button class="btn-free" @click="startEmptyWorkout()">Entrenament lliure</button>
                </div>
            </div>

            <div class="today-card no-routine" v-else-if="!loadingRoutine">
                <p>No tens cap rutina per defecte configurada.</p>
                <div class="actions-row">
                    <button class="btn-secondary" @click="to('/routines')">Gestionar rutines</button>
                    <button class="btn-start" @click="startEmptyWorkout()">Entrenament lliure</button>
                </div>
            </div>

            <!-- Quick access -->
            <div class="quick-access">
                <div class="quick-card" @click="to('/routines')">Rutines</div>
                <div class="quick-card" @click="to('/exercises')">Exercicis</div>
                <div class="quick-card" @click="to('/workouts')">Historial</div>
                <div class="quick-card" @click="startEmptyWorkout()">Entrenament lliure</div>
            </div>

            <!-- Recent workouts -->
            <div class="section">
                <h2>Últims entrenaments</h2>
                <div v-if="loadingWorkouts" class="loading-text">Carregant...</div>
                <div v-else-if="recentWorkouts.length === 0" class="empty-text">Encara no has fet cap entrenament.</div>
                <div v-else class="workout-list">
                    <div v-for="w in recentWorkouts" :key="w.id" class="workout-card" @click="to('/workouts/' + w.id)">
                        <div>
                            <div class="workout-date">{{ formatDate(w.date) }}</div>
                            <div class="workout-notes">{{ w.notes || 'Sense notes' }}</div>
                        </div>
                        <span>&rsaquo;</span>
                    </div>
                </div>
            </div>

            <!-- Routine picker modal -->
            <div v-if="showRoutinePicker" class="modal-overlay" @click.self="showRoutinePicker = false">
                <div class="modal">
                    <h3>Tria una rutina</h3>
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
                                <span v-if="loadingPickerDay" class="loading-text">Carregant...</span>
                                <span v-else-if="pickerNextDay">Pròxim: <b>{{ pickerNextDay.name }}</b></span>
                            </div>
                        </div>
                    </div>
                    <div class="modal-actions">
                        <button class="btn-cancel" @click="showRoutinePicker = false">Cancel·lar</button>
                        <button
                            class="btn-save"
                            @click="startPickerRoutine()"
                            :disabled="!pickerNextDay || startingPicker"
                        >
                            {{ startingPicker ? 'Iniciant...' : 'Començar' }}
                        </button>
                    </div>
                </div>
            </div>

        </div>
    </AppPage>
</template>

<script lang="ts" src="./home.ts"></script>
<style lang="scss" src="./home.scss"></style>
