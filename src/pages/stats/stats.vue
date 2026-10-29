<template>
        <div class="stats-page">

            <div class="page-header">
                <h1>{{ $t('stats.title') }}</h1>
            </div>

            <!-- Quick ranges + custom dates -->
            <div class="range-bar">
                <div class="range-chips">
                    <button v-for="r in ranges" :key="r.key" type="button" class="chip" :class="{ on: isRange(r.key) }"
                        @click="setRange(r.key)">{{ $t('stats.dash.presets.' + r.label) }}</button>
                </div>
                <div class="overview-filters">
                    <div class="filter-group">
                        <label>{{ $t('stats.filters.from') }}</label>
                        <input type="date" v-model="overviewFrom" @change="fetchOverview()" />
                    </div>
                    <div class="filter-group">
                        <label>{{ $t('stats.filters.to') }}</label>
                        <input type="date" v-model="overviewTo" @change="fetchOverview()" />
                    </div>
                    <button class="btn-clear-filter" @click="setRange('all')" v-if="overviewFrom || overviewTo">
                        {{ $t('stats.filters.clear') }}
                    </button>
                </div>
            </div>

            <!-- Overview cards -->
            <div class="overview-grid" v-if="overview">
                <div class="stat-card">
                    <div class="stat-value">{{ overview.total_workouts ?? '—' }}</div>
                    <div class="stat-label">{{ $t('stats.overview.totalWorkouts') }}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">{{ overview.total_volume_kg ? formatVolume(overview.total_volume_kg) : '—' }}</div>
                    <div class="stat-label">{{ $t('stats.overview.totalVolume') }}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">{{ overview.total_sets ?? '—' }}</div>
                    <div class="stat-label">{{ $t('stats.dash.totalSets') }}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">{{ overview.this_month ?? '—' }}</div>
                    <div class="stat-label">{{ $t('stats.overview.thisMonth') }}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">{{ overview.workouts_this_week ?? '—' }}</div>
                    <div class="stat-label">{{ $t('stats.dash.thisWeek') }}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">🔥 {{ overview.week_streak ?? 0 }}</div>
                    <div class="stat-label">{{ $t('stats.dash.weekStreak') }}</div>
                </div>
                <div class="stat-card highlight" v-if="overview.favorite_exercise">
                    <div class="stat-value small">{{ overview.favorite_exercise.name }}</div>
                    <div class="stat-label">{{ $t('stats.overview.favoriteExercise', { n: overview.favorite_exercise.times }) }}</div>
                </div>
                <div class="stat-card" v-if="overview.top_muscle_group">
                    <div class="stat-value small">{{ overview.top_muscle_group }}</div>
                    <div class="stat-label">{{ $t('stats.dash.topGroup') }}</div>
                </div>
            </div>
            <div v-else-if="loadingOverview" class="loading-text">{{ $t('stats.overview.loading') }}</div>

            <!-- Last workout: what you did and how it went compared with the previous time -->
            <div class="section-card last-workout" v-if="overview?.last_workout">
                <div class="lw-head">
                    <div>
                        <h2>{{ $t('stats.dash.last.title') }}</h2>
                        <div class="lw-sub">{{ formatHistoryDate(overview.last_workout.date) }}<template v-if="overview.last_workout.day_name"> · {{ overview.last_workout.day_name }}</template></div>
                    </div>
                    <button type="button" class="lw-open" @click="to('/workouts/' + overview.last_workout.id)">{{ $t('stats.dash.last.open') }} &rsaquo;</button>
                </div>

                <div class="lw-totals">
                    <div class="lw-total">
                        <b>{{ formatVolume(overview.last_workout.volume_kg) }}</b>
                        <span>{{ $t('stats.dash.last.volume') }}</span>
                        <em v-if="overview.last_workout.volume_delta_pct !== null" :class="deltaClass(overview.last_workout.volume_delta_pct)">{{ deltaText(overview.last_workout.volume_delta_pct) }}</em>
                    </div>
                    <div class="lw-total"><b>{{ overview.last_workout.sets }}</b><span>{{ $t('stats.dash.last.sets') }}</span></div>
                    <div class="lw-total"><b>{{ overview.last_workout.exercises_count }}</b><span>{{ $t('stats.dash.last.exercises') }}</span></div>
                    <div class="lw-total" v-if="overview.last_workout.prs"><b>🏆 {{ overview.last_workout.prs }}</b><span>{{ $t('stats.dash.last.records') }}</span></div>
                </div>

                <p class="lw-compare" v-if="overview.last_workout.compared_with">
                    {{ overview.last_workout.compared_with === 'day'
                        ? $t('stats.dash.last.vsDay', { day: overview.last_workout.day_name })
                        : $t('stats.dash.last.vsExercises') }}
                </p>

                <div class="lw-list">
                    <button v-for="e in overview.last_workout.exercises" :key="e.id" type="button" class="lw-row" @click="openExercise(e)">
                        <div class="lw-line">
                            <span class="lw-name">{{ e.name }}<span v-if="e.is_pr" class="pr-badge">PR</span></span>
                            <span class="lw-delta" :class="deltaClass(e.volume_delta_pct)">{{ e.volume_delta_pct !== null ? deltaText(e.volume_delta_pct) : $t('stats.dash.last.first') }}</span>
                        </div>
                        <div class="lw-meta">{{ e.sets }} {{ $t('stats.dash.last.setsShort') }} · {{ e.max_weight }} kg × {{ e.top_reps }} · {{ formatVolume(e.volume_kg) }}</div>
                        <div class="lw-bar"><div class="fill" :style="{ width: barWidth(e) + '%' }"></div></div>
                    </button>
                </div>
            </div>

            <!-- Calendar of the last year -->
            <div class="section-card" v-if="heatmapWeeks.length">
                <h2>{{ $t('stats.dash.heatmap.title') }}</h2>
                <div class="heatmap">
                    <div v-for="(w, wi) in heatmapWeeks" :key="wi" class="hm-week">
                        <div class="hm-label">{{ w.label }}</div>
                        <template v-for="(d, di) in w.days" :key="di">
                            <div v-if="d" class="hm-cell" :class="'l' + d.level"
                                :title="$t('stats.dash.heatmap.tooltip', { date: formatHistoryDate(d.date), n: d.count })"></div>
                            <div v-else class="hm-cell none"></div>
                        </template>
                    </div>
                </div>
                <div class="hm-legend">
                    <span>{{ $t('stats.dash.heatmap.less') }}</span>
                    <i class="hm-cell l0"></i><i class="hm-cell l1"></i><i class="hm-cell l2"></i><i class="hm-cell l3"></i>
                    <span>{{ $t('stats.dash.heatmap.more') }}</span>
                </div>
            </div>

            <!-- Monthly trend and share per muscle group -->
            <div class="dash-charts" v-if="overview">
                <div class="section-card" v-if="overview.monthly?.length">
                    <h2>{{ $t('stats.dash.monthly.title') }}</h2>
                    <div class="chart-wrap"><canvas id="monthlyCanvas"></canvas></div>
                </div>
                <div class="section-card" v-if="overview.by_muscle_group?.length">
                    <h2>{{ $t('stats.dash.groups.title') }}</h2>
                    <div class="chart-wrap"><canvas id="groupCanvas"></canvas></div>
                </div>
            </div>

            <!-- Exercise progression -->
            <div class="section-card" id="progress-section">
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
</template>

<script lang="ts" src="./stats.ts"></script>
<style lang="scss" src="./stats.scss"></style>
