<template>
    <div class="stats-page">

        <div class="page-header">
            <h1>{{ $t('stats.title') }}</h1>
        </div>

        <!-- Range of the totals -->
        <div class="range-chips">
            <button v-for="r in ranges" :key="r.key" type="button" class="chip" :class="{ on: range === r.key }"
                @click="setRange(r.key)">{{ $t('stats.dash.presets.' + r.label) }}</button>
        </div>

        <!-- Key numbers -->
        <div class="overview-grid" v-if="overview">
            <div class="stat-card">
                <div class="stat-value">{{ overview.total_workouts ?? '—' }}</div>
                <div class="stat-label">{{ $t('stats.overview.totalWorkouts') }}</div>
            </div>
            <div class="stat-card highlight">
                <div class="stat-value">🔥 {{ overview.week_streak ?? 0 }}</div>
                <div class="stat-label">{{ $t('stats.dash2.weeksStreak') }} · {{ overview.streak ?? 0 }} {{ $t('stats.dash2.daysShort') }}</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">{{ overview.workouts_this_week ?? 0 }}</div>
                <div class="stat-label">{{ $t('stats.dash.thisWeek') }}</div>
            </div>
        </div>
        <div v-else-if="loadingOverview" class="loading-text">{{ $t('stats.overview.loading') }}</div>

        <!-- Last workout -->
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
                {{ comparedText(overview.last_workout) }}
            </p>

            <div class="lw-list">
                <div v-for="e in overview.last_workout.exercises" :key="e.id" class="lw-row">
                    <div class="lw-line">
                        <span class="lw-name">{{ e.name }}<span v-if="e.is_pr" class="pr-badge">PR</span></span>
                        <span class="lw-delta" :class="deltaClass(e.volume_delta_pct)">{{ e.volume_delta_pct !== null ? deltaText(e.volume_delta_pct) : $t('stats.dash.last.first') }}</span>
                    </div>
                    <div class="lw-meta">{{ e.sets }} {{ $t('stats.dash.last.setsShort') }} · {{ e.max_weight }} kg × {{ e.top_reps }} · {{ formatVolume(e.volume_kg) }}</div>
                    <div class="lw-bar"><div class="fill" :style="{ width: barWidth(e) + '%' }"></div></div>
                </div>
            </div>
        </div>

        <!-- Calendar: the current month, the whole year in a modal -->
        <div class="section-card calendar-card" v-if="overview">
            <div class="cal-head">
                <button type="button" class="cal-nav" :disabled="!canGoBack" @click="calMonthOffset--" :aria-label="$t('stats.dash2.prevMonth')">&lsaquo;</button>
                <div class="cal-title">
                    <h2>{{ calendarMonth.label }}</h2>
                    <span>{{ $t('stats.dash2.monthCount', { n: calendarMonth.trained }) }}</span>
                </div>
                <button type="button" class="cal-nav" :disabled="calMonthOffset >= 0" @click="calMonthOffset++" :aria-label="$t('stats.dash2.nextMonth')">&rsaquo;</button>
            </div>

            <div class="cal-grid">
                <div v-for="w in weekdayLabels" :key="w" class="cal-dow">{{ w }}</div>
                <template v-for="(c, i) in calendarMonth.cells" :key="i">
                    <div v-if="c" class="cal-day" :class="['l' + c.level, { today: c.today, future: c.future }]"
                        :title="$t('stats.dash.heatmap.tooltip', { date: formatHistoryDate(c.date), n: c.count })">{{ c.day }}</div>
                    <div v-else class="cal-day empty"></div>
                </template>
            </div>

            <SectionTile v-model:open="showYear" :title="$t('stats.dash2.viewYear')">
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
            </SectionTile>
        </div>

        <!-- Monthly trend (collapsed until opened) -->
        <div class="section-card collapsible" v-if="overview?.monthly?.length">
            <button type="button" class="collapse-head" :aria-expanded="monthlyOpen" @click="toggleMonthly()">
                <h2>{{ $t('stats.dash.monthly.title') }}</h2>
                <span class="collapse-arrow" :class="{ open: monthlyOpen }">&rsaquo;</span>
            </button>
            <div v-if="monthlyOpen" class="chart-wrap"><canvas id="monthlyCanvas"></canvas></div>
        </div>

        <!-- Progression: muscle group -> exercise -> last time, current and record -->
        <div class="section-card progress-card">
            <h2>{{ $t('stats.dash2.progress.title') }}</h2>

            <label class="group-select">
                <span>{{ $t('stats.dash2.progress.group') }}</span>
                <select v-model="selectedMuscleGroupId" @change="onGroupChange()">
                    <option v-for="mg in muscleGroups" :key="mg.id" :value="mg.id">{{ mg.name }}</option>
                </select>
            </label>

            <div v-if="loadingGroup" class="loading-text">{{ $t('stats.muscleGroup.loading') }}</div>

            <div v-if="groupStats?.sessions?.length" class="group-chart">
                <div class="chart-title">{{ $t('stats.dash2.progress.groupEvolution', { group: selectedGroupName }) }}</div>
                <div class="chart-wrap"><canvas id="groupVolumeCanvas"></canvas></div>
            </div>

            <div v-else-if="groupStats" class="ex-list">
                <div v-if="!(groupStats.bests ?? []).length" class="empty-text">{{ $t('stats.dash2.progress.empty') }}</div>

                <div v-for="ex in (groupStats.bests ?? [])" :key="ex.id" class="ex-item" :class="{ open: openExerciseId === ex.id }">
                    <button type="button" class="ex-head" @click="toggleExercise(ex)">
                        <span class="ex-name">{{ ex.name }}</span>
                        <span class="ex-meta">{{ $t('stats.muscleGroup.timesTrained', { n: ex.times_trained }) }}</span>
                        <span class="ex-arrow">&rsaquo;</span>
                    </button>

                    <div v-if="openExerciseId === ex.id" class="ex-body">
                        <div v-if="loadingExerciseId === ex.id" class="loading-text">{{ $t('stats.exercise.loading') }}</div>

                        <template v-else-if="exerciseView(ex.id)">
                            <div v-if="!exerciseView(ex.id).current" class="empty-text">{{ $t('stats.exercise.noSessions') }}</div>

                            <div v-else class="cmp-grid">
                                <div class="cmp-card">
                                    <div class="cmp-label">{{ $t('stats.dash2.progress.previous') }}</div>
                                    <template v-if="exerciseView(ex.id).previous">
                                        <div class="cmp-value">{{ exerciseView(ex.id).previous.max_weight }} kg</div>
                                        <div class="cmp-sub">{{ formatShortDate(exerciseView(ex.id).previous.date) }} · {{ exerciseView(ex.id).previous.total_sets }} {{ $t('stats.dash.last.setsShort') }}</div>
                                        <div class="cmp-sub">{{ formatVolume(exerciseView(ex.id).previous.total_volume) }}</div>
                                    </template>
                                    <div v-else class="cmp-sub">—</div>
                                </div>

                                <div class="cmp-card current">
                                    <div class="cmp-label">{{ $t('stats.dash2.progress.current') }}</div>
                                    <div class="cmp-value">{{ exerciseView(ex.id).current.max_weight }} kg</div>
                                    <div class="cmp-sub">{{ formatShortDate(exerciseView(ex.id).current.date) }} · {{ exerciseView(ex.id).current.total_sets }} {{ $t('stats.dash.last.setsShort') }}</div>
                                    <div class="cmp-sub">{{ formatVolume(exerciseView(ex.id).current.total_volume) }}</div>
                                    <div class="cmp-changes" v-if="exerciseView(ex.id).previous">
                                        <span v-for="c in exerciseView(ex.id).changes" :key="c.text" class="cmp-delta" :class="c.cls">{{ c.text }}</span>
                                        <span v-if="!exerciseView(ex.id).changes.length" class="cmp-delta flat">{{ $t('stats.dash2.progress.same') }}</span>
                                    </div>
                                </div>

                                <div class="cmp-card record" v-if="exerciseView(ex.id).pr?.best_weight">
                                    <div class="cmp-label">🏆 {{ $t('stats.dash2.progress.record') }}</div>
                                    <div class="cmp-value">{{ exerciseView(ex.id).pr.best_weight.weight }} kg</div>
                                    <div class="cmp-sub">{{ exerciseView(ex.id).pr.best_weight.reps }} {{ $t('stats.dash2.progress.reps') }} · {{ formatShortDate(exerciseView(ex.id).pr.best_weight.date) }}</div>
                                    <div class="cmp-sub" v-if="exerciseView(ex.id).pr.best_volume">{{ $t('stats.pr.bestVolume') }}: {{ formatVolume(exerciseView(ex.id).pr.best_volume.volume) }}</div>
                                </div>
                            </div>

                            <div v-if="exerciseView(ex.id).current && exerciseView(ex.id).sessionCount > 1" class="ex-charts">
                                <div class="chart-block">
                                    <div class="chart-title">{{ $t('stats.charts.maxWeightTitle') }}</div>
                                    <div class="chart-wrap small"><canvas id="weightCanvas"></canvas></div>
                                </div>
                                <div class="chart-block">
                                    <div class="chart-title">{{ $t('stats.charts.volumeTitle') }}</div>
                                    <div class="chart-wrap small"><canvas id="volumeCanvas"></canvas></div>
                                </div>
                                <div class="chart-block">
                                    <div class="chart-title">{{ $t('stats.charts.avgRepsTitle') }}</div>
                                    <div class="chart-wrap small"><canvas id="repsCanvas"></canvas></div>
                                </div>
                            </div>
                        </template>
                    </div>
                </div>
            </div>
        </div>

    </div>
</template>

<script lang="ts" src="./stats.ts"></script>
<style lang="scss" src="./stats.scss"></style>
