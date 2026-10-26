<template>
    <AppPage name="stats-page" layout="backoffice">
        <div class="stats-page">

            <div class="page-header">
                <h1>{{ $t('stats.title') }}</h1>
            </div>

            <!-- Overview date filter -->
            <div class="overview-filters">
                <div class="filter-group">
                    <label>{{ $t('stats.filters.from') }}</label>
                    <input type="date" v-model="overviewFrom" @change="fetchOverview()" />
                </div>
                <div class="filter-group">
                    <label>{{ $t('stats.filters.to') }}</label>
                    <input type="date" v-model="overviewTo" @change="fetchOverview()" />
                </div>
                <button class="btn-clear-filter" @click="overviewFrom = ''; overviewTo = ''; fetchOverview()" v-if="overviewFrom || overviewTo">
                    {{ $t('stats.filters.clear') }}
                </button>
            </div>

            <!-- Overview cards -->
            <div class="overview-grid" v-if="overview">
                <div class="stat-card">
                    <div class="stat-value">{{ overview.total_workouts ?? '—' }}</div>
                    <div class="stat-label">{{ $t('stats.overview.totalWorkouts') }}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">{{ overview.this_month ?? '—' }}</div>
                    <div class="stat-label">{{ $t('stats.overview.thisMonth') }}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">{{ overview.total_volume_kg ? formatVolume(overview.total_volume_kg) : '—' }}</div>
                    <div class="stat-label">{{ $t('stats.overview.totalVolume') }}</div>
                </div>
                <div class="stat-card highlight" v-if="overview.favorite_exercise">
                    <div class="stat-value">{{ overview.favorite_exercise.name }}</div>
                    <div class="stat-label">{{ $t('stats.overview.favoriteExercise', { n: overview.favorite_exercise.times }) }}</div>
                </div>
            </div>
            <div v-else-if="loadingOverview" class="loading-text">{{ $t('stats.overview.loading') }}</div>

            <!-- Exercise progression -->
            <div class="section-card">
                <h2>{{ $t('stats.exercise.title') }}</h2>

                <div class="exercise-search">
                    <div class="search-wrapper">
                        <input
                            type="text"
                            v-model="searchQuery"
                            :placeholder="$t('stats.exercise.searchPlaceholder')"
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

                <div v-if="loadingExerciseStats" class="loading-text">{{ $t('stats.exercise.loading') }}</div>

                <div v-else-if="exerciseStats" class="exercise-stats">
                    <div class="exercise-stats-header">
                        <h3>{{ exerciseStats.exercise?.name }}</h3>
                        <div class="quick-stats" v-if="exerciseStats.sessions?.length">
                            <div class="quick-stat">
                                <span class="qval">{{ exerciseStats.sessions.at(-1)?.max_weight }} kg</span>
                                <span class="qlabel">{{ $t('stats.exercise.lastMax') }}</span>
                            </div>
                            <div class="quick-stat">
                                <span class="qval">{{ exerciseStats.sessions.length }}</span>
                                <span class="qlabel">{{ $t('stats.exercise.sessions') }}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Personal Records -->
                    <div class="pr-block" v-if="exercisePr">
                        <div class="pr-title">{{ $t('stats.pr.title') }}</div>
                        <div class="pr-grid">
                            <div class="pr-item" v-if="exercisePr.best_weight">
                                <div class="pr-value">{{ exercisePr.best_weight.weight }} kg</div>
                                <div class="pr-label">{{ $t('stats.pr.bestWeight') }}</div>
                                <div class="pr-sub">{{ $t('stats.pr.repsSub', { n: exercisePr.best_weight.reps }) }} · {{ formatHistoryDate(exercisePr.best_weight.date) }}</div>
                            </div>
                            <div class="pr-item" v-if="exercisePr.best_volume">
                                <div class="pr-value">{{ formatVolume(exercisePr.best_volume.volume) }}</div>
                                <div class="pr-label">{{ $t('stats.pr.bestVolume') }}</div>
                                <div class="pr-sub">{{ $t('stats.pr.setsSub', { n: exercisePr.best_volume.sets }) }} · {{ formatHistoryDate(exercisePr.best_volume.date) }}</div>
                            </div>
                        </div>
                    </div>

                    <div v-if="exerciseStats.sessions?.length === 0" class="empty-text">
                        {{ $t('stats.exercise.noSessions') }}
                    </div>

                    <div v-else class="charts-grid">
                        <div class="chart-block">
                            <div class="chart-title">{{ $t('stats.charts.maxWeightTitle') }}</div>
                            <canvas id="weightCanvas"></canvas>
                        </div>
                        <div class="chart-block">
                            <div class="chart-title">{{ $t('stats.charts.volumeTitle') }}</div>
                            <canvas id="volumeCanvas"></canvas>
                        </div>
                        <div class="chart-block">
                            <div class="chart-title">{{ $t('stats.charts.avgRepsTitle') }}</div>
                            <canvas id="repsCanvas"></canvas>
                        </div>
                    </div>

                    <!-- Session detail table -->
                    <div class="sessions-table" v-if="exerciseStats.sessions?.length">
                        <table>
                            <thead>
                                <tr>
                                    <th>{{ $t('stats.table.date') }}</th>
                                    <th>{{ $t('stats.table.maxWeight') }}</th>
                                    <th>{{ $t('stats.table.volume') }}</th>
                                    <th>{{ $t('stats.table.avgReps') }}</th>
                                    <th>{{ $t('stats.table.sets') }}</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="h in [...exerciseStats.sessions].reverse()" :key="h.date" :class="{ 'pr-row': h.is_pr }">
                                    <td>
                                        {{ formatHistoryDate(h.date) }}
                                        <span class="pr-star" v-if="h.is_pr" :title="$t('stats.pr.tooltip')">⭐</span>
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
                    {{ $t('stats.exercise.hint') }}
                </div>
            </div>

            <!-- Muscle group stats -->
            <div class="section-card">
                <h2>{{ $t('stats.muscleGroup.title') }}</h2>

                <select v-model="selectedMuscleGroupId" @change="onMuscleGroupChange()">
                    <option value="">{{ $t('stats.muscleGroup.select') }}</option>
                    <option v-for="mg in muscleGroups" :key="mg.id" :value="mg.id">{{ mg.name }}</option>
                </select>

                <div v-if="loadingMgStats" class="loading-text" style="margin-top:1rem">{{ $t('stats.muscleGroup.loading') }}</div>

                <div v-else-if="muscleGroupStats" class="mg-stats">

                    <!-- Sessions volume chart -->
                    <div v-if="muscleGroupStats.sessions?.length" class="mg-chart-block">
                        <div class="chart-title">{{ $t('stats.charts.volumeTitle') }}</div>
                        <canvas id="mgVolumeCanvas"></canvas>
                    </div>

                    <!-- Best exercises list -->
                    <div class="mg-exercises-title">{{ $t('stats.muscleGroup.bestsTitle') }}</div>
                    <div class="mg-exercises">
                        <div
                            v-for="ex in (muscleGroupStats.bests ?? [])"
                            :key="ex.id"
                            class="mg-exercise-row"
                            @click="selectExercise(ex)"
                        >
                            <div class="ex-name">{{ ex.name }}</div>
                            <div class="ex-meta">
                                <span v-if="ex.best_weight">{{ $t('stats.muscleGroup.best') }} <b>{{ ex.best_weight }} kg</b></span>
                                <span v-if="ex.best_reps" class="ex-reps">{{ $t('stats.muscleGroup.repsMeta', { n: ex.best_reps }) }}</span>
                                <span class="ex-times">{{ $t('stats.muscleGroup.timesTrained', { n: ex.times_trained }) }}</span>
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
