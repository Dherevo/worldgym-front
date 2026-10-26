<template>
    <AppPage name="stats-page" layout="backoffice">
        <div class="stats-page">

            <div class="page-header">
                <h1>Progressió i estadístiques</h1>
            </div>

            <!-- Overview date filter -->
            <div class="overview-filters">
                <div class="filter-group">
                    <label>Des de</label>
                    <input type="date" v-model="overviewFrom" @change="fetchOverview()" />
                </div>
                <div class="filter-group">
                    <label>Fins a</label>
                    <input type="date" v-model="overviewTo" @change="fetchOverview()" />
                </div>
                <button class="btn-clear-filter" @click="overviewFrom = ''; overviewTo = ''; fetchOverview()" v-if="overviewFrom || overviewTo">
                    Netejar filtre
                </button>
            </div>

            <!-- Overview cards -->
            <div class="overview-grid" v-if="overview">
                <div class="stat-card">
                    <div class="stat-value">{{ overview.total_workouts ?? '—' }}</div>
                    <div class="stat-label">Entrenaments totals</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">{{ overview.this_month ?? '—' }}</div>
                    <div class="stat-label">Aquest mes</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">{{ overview.total_volume_kg ? formatVolume(overview.total_volume_kg) : '—' }}</div>
                    <div class="stat-label">Volum total mogut</div>
                </div>
                <div class="stat-card highlight" v-if="overview.favorite_exercise">
                    <div class="stat-value">{{ overview.favorite_exercise.name }}</div>
                    <div class="stat-label">Exercici favorit ({{ overview.favorite_exercise.times }}x)</div>
                </div>
            </div>
            <div v-else-if="loadingOverview" class="loading-text">Carregant estadístiques...</div>

            <!-- Exercise progression -->
            <div class="section-card">
                <h2>Progressió per exercici</h2>

                <div class="exercise-search">
                    <div class="search-wrapper">
                        <input
                            type="text"
                            v-model="searchQuery"
                            placeholder="Cerca un exercici..."
                            @focus="showDropdown = true"
                            @blur="hideDropdown()"
                            @input="showDropdown = true"
                        />
                        <div class="dropdown" v-if="showDropdown && filteredExercises.length">
                            <div
                                v-for="ex in filteredExercises"
                                :key="ex.id"
                                class="dropdown-item"
                                @mousedown="selectExercise(ex)"
                            >
                                <span>{{ ex.name }}</span>
                                <small v-if="ex.equipment">{{ ex.equipment.name }}</small>
                            </div>
                        </div>
                    </div>
                </div>

                <div v-if="loadingExerciseStats" class="loading-text">Carregant dades...</div>

                <div v-else-if="exerciseStats" class="exercise-stats">
                    <div class="exercise-stats-header">
                        <h3>{{ exerciseStats.exercise?.name }}</h3>
                        <div class="quick-stats" v-if="exerciseStats.sessions?.length">
                            <div class="quick-stat">
                                <span class="qval">{{ exerciseStats.sessions.at(-1)?.max_weight }} kg</span>
                                <span class="qlabel">Últim màxim</span>
                            </div>
                            <div class="quick-stat">
                                <span class="qval">{{ exerciseStats.sessions.length }}</span>
                                <span class="qlabel">Sessions</span>
                            </div>
                        </div>
                    </div>

                    <!-- Personal Records -->
                    <div class="pr-block" v-if="exercisePr">
                        <div class="pr-title">🏆 Personal Records</div>
                        <div class="pr-grid">
                            <div class="pr-item" v-if="exercisePr.best_weight">
                                <div class="pr-value">{{ exercisePr.best_weight.weight }} kg</div>
                                <div class="pr-label">Millor pes</div>
                                <div class="pr-sub">× {{ exercisePr.best_weight.reps }} reps · {{ formatHistoryDate(exercisePr.best_weight.date) }}</div>
                            </div>
                            <div class="pr-item" v-if="exercisePr.best_volume">
                                <div class="pr-value">{{ formatVolume(exercisePr.best_volume.volume) }}</div>
                                <div class="pr-label">Millor sessió (volum)</div>
                                <div class="pr-sub">{{ exercisePr.best_volume.sets }} sèries · {{ formatHistoryDate(exercisePr.best_volume.date) }}</div>
                            </div>
                        </div>
                    </div>

                    <div v-if="exerciseStats.sessions?.length === 0" class="empty-text">
                        No hi ha sessions registrades per aquest exercici.
                    </div>

                    <div v-else class="charts-grid">
                        <div class="chart-block">
                            <div class="chart-title">Pes màxim per sessió (kg)</div>
                            <canvas id="weightCanvas"></canvas>
                        </div>
                        <div class="chart-block">
                            <div class="chart-title">Volum total per sessió (kg)</div>
                            <canvas id="volumeCanvas"></canvas>
                        </div>
                        <div class="chart-block">
                            <div class="chart-title">Repeticions mitjanes per sèrie</div>
                            <canvas id="repsCanvas"></canvas>
                        </div>
                    </div>

                    <!-- Session detail table -->
                    <div class="sessions-table" v-if="exerciseStats.sessions?.length">
                        <table>
                            <thead>
                                <tr>
                                    <th>Data</th>
                                    <th>Pes màx.</th>
                                    <th>Volum</th>
                                    <th>Reps (mitj.)</th>
                                    <th>Sèries</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="h in [...exerciseStats.sessions].reverse()" :key="h.date" :class="{ 'pr-row': h.is_pr }">
                                    <td>
                                        {{ new Date(h.date).toLocaleDateString('ca-ES', { day: 'numeric', month: 'short', year: 'numeric' }) }}
                                        <span class="pr-star" v-if="h.is_pr" title="Personal Record">⭐</span>
                                    </td>
                                    <td><b>{{ h.max_weight }} kg</b></td>
                                    <td>{{ h.total_volume }} kg</td>
                                    <td>{{ parseFloat(h.avg_reps).toFixed(1) }}</td>
                                    <td>{{ h.total_sets ?? '—' }}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <div v-else-if="!loadingExerciseStats && !selectedExercise" class="empty-hint">
                    Cerca un exercici per veure la seva evolució al llarg del temps.
                </div>
            </div>

            <!-- Muscle group stats -->
            <div class="section-card">
                <h2>Progrés per grup muscular</h2>

                <select v-model="selectedMuscleGroupId" @change="onMuscleGroupChange()">
                    <option value="">Selecciona un grup muscular</option>
                    <option v-for="mg in muscleGroups" :key="mg.id" :value="mg.id">{{ mg.name }}</option>
                </select>

                <div v-if="loadingMgStats" class="loading-text" style="margin-top:1rem">Carregant...</div>

                <div v-else-if="muscleGroupStats" class="mg-stats">

                    <!-- Sessions volume chart -->
                    <div v-if="muscleGroupStats.sessions?.length" class="mg-chart-block">
                        <div class="chart-title">Volum total per sessió (kg)</div>
                        <canvas id="mgVolumeCanvas"></canvas>
                    </div>

                    <!-- Best exercises list -->
                    <div class="mg-exercises-title">Millors marques per exercici</div>
                    <div class="mg-exercises">
                        <div
                            v-for="ex in (muscleGroupStats.bests ?? [])"
                            :key="ex.id"
                            class="mg-exercise-row"
                            @click="selectExercise(ex)"
                        >
                            <div class="ex-name">{{ ex.name }}</div>
                            <div class="ex-meta">
                                <span v-if="ex.best_weight">Millor: <b>{{ ex.best_weight }} kg</b></span>
                                <span v-if="ex.best_reps" class="ex-reps">× {{ ex.best_reps }} reps</span>
                                <span class="ex-times">{{ ex.times_trained }}x entrenat</span>
                            </div>
                            <span class="ex-arrow">&rsaquo;</span>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    </AppPage>
</template>

<script lang="ts" src="./stats.ts"></script>
<style lang="scss" src="./stats.scss"></style>
