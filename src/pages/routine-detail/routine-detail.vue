<template>
    <AppPage name="routine-detail-page" layout="backoffice">
        <div class="routine-detail-page">

            <div class="page-header">
                <button class="btn-back" @click="to('/routines')">&larr; Rutines</button>
                <h1 v-if="routine">{{ routine.name }}</h1>
                <div class="header-actions" v-if="routine">
                    <button class="btn-secondary" @click="openAddDay()">+ Afegir dia</button>
                </div>
            </div>

            <div v-if="loading" class="loading-text">Carregant...</div>

            <div v-else-if="routine" class="days-list">
                <div v-if="routine.days?.length === 0" class="empty-text">
                    No hi ha dies configurats. Afegeix-ne un!
                </div>
                <div v-for="day in routine.days" :key="day.id" class="day-card">
                    <div class="day-header">
                        <div>
                            <span class="day-number">Dia {{ day.day_number }}</span>
                            <span class="day-name">{{ day.name }}</span>
                        </div>
                        <div class="day-actions">
                            <button class="btn-train" @click="startDay(day)" :disabled="starting">
                                {{ starting ? '...' : 'Entrenar' }}
                            </button>
                            <button @click="openEditDay(day)">Editar</button>
                            <button class="danger" @click="deleteDay(day)">Eliminar</button>
                        </div>
                    </div>

                    <div class="exercises-table" v-if="day.exercises?.length > 0">
                        <table>
                            <thead>
                                <tr>
                                    <th>Exercici</th>
                                    <th>Sets</th>
                                    <th>Reps</th>
                                    <th>Pes (kg)</th>
                                    <th>Descans</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="ex in day.exercises" :key="ex.id">
                                    <td>{{ ex.exercise?.name }}</td>
                                    <td>{{ ex.sets_target }}</td>
                                    <td>{{ ex.reps_target }}</td>
                                    <td>{{ ex.weight_target }}</td>
                                    <td>{{ ex.rest_seconds }}s</td>
                                    <td>
                                        <button @click="openEditExercise(day, ex)">Ed.</button>
                                        <button class="danger" @click="deleteExercise(day, ex)">Elim.</button>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <div v-else class="empty-exercises">Cap exercici. <span class="link" @click="openAddExercise(day)">Afegeix-ne un</span></div>
                    <button class="btn-add-exercise" @click="openAddExercise(day)">+ Afegir exercici</button>
                </div>
            </div>

            <!-- Day Form Modal -->
            <div v-if="showDayForm" class="modal-overlay" @click.self="showDayForm = false">
                <div class="modal">
                    <h2>{{ editingDay ? 'Editar dia' : 'Nou dia' }}</h2>
                    <div class="form-group">
                        <label>Número de dia</label>
                        <input type="number" v-model.number="dayForm.day_number" min="1" />
                    </div>
                    <div class="form-group">
                        <label>Nom</label>
                        <input type="text" v-model="dayForm.name" placeholder="Ex: Dia 1 - Pit i Tríceps" />
                    </div>
                    <div class="form-actions">
                        <button class="btn-cancel" @click="showDayForm = false">Cancel·lar</button>
                        <button class="btn-primary" @click="saveDay()" :disabled="savingDay">
                            {{ savingDay ? 'Desant...' : 'Desar' }}
                        </button>
                    </div>
                </div>
            </div>

            <!-- Exercise Form Modal -->
            <div v-if="showExerciseForm" class="modal-overlay" @click.self="showExerciseForm = false">
                <div class="modal">
                    <h2>{{ editingExercise ? 'Editar exercici' : 'Afegir exercici' }}</h2>
                    <div class="form-group">
                        <label>Exercici *</label>
                        <select v-model.number="exerciseForm.exercise_id">
                            <option :value="null">Selecciona exercici</option>
                            <option v-for="ex in allExercises" :key="ex.id" :value="ex.id">{{ ex.name }}</option>
                        </select>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Sets</label>
                            <input type="number" v-model.number="exerciseForm.sets_target" min="1" />
                        </div>
                        <div class="form-group">
                            <label>Reps</label>
                            <input type="number" v-model.number="exerciseForm.reps_target" min="1" />
                        </div>
                        <div class="form-group">
                            <label>Pes (kg)</label>
                            <input type="number" v-model.number="exerciseForm.weight_target" min="0" step="0.5" />
                        </div>
                        <div class="form-group">
                            <label>Descans (s)</label>
                            <input type="number" v-model.number="exerciseForm.rest_seconds" min="0" step="15" />
                        </div>
                    </div>
                    <div class="form-actions">
                        <button class="btn-cancel" @click="showExerciseForm = false">Cancel·lar</button>
                        <button class="btn-primary" @click="saveExercise()" :disabled="savingExercise">
                            {{ savingExercise ? 'Desant...' : 'Desar' }}
                        </button>
                    </div>
                </div>
            </div>

        </div>
    </AppPage>
</template>

<script lang="ts" src="./routine-detail.ts"></script>
<style lang="scss" src="./routine-detail.scss"></style>
