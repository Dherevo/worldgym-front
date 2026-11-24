<template>
    <AppPage name="progression-page" layout="backoffice">
        <div class="stats-page progression-view">
            <div class="sub-top">
                <BackButton class="btn-back" @click="goBack()" />
                <h1>{{ $t('stats.home.progression') }}</h1>
            </div>

        <!-- Progression: muscle group -> exercise -> last time, current and record -->
        <div class="section-card progress-card">
            <label class="group-select">
                <span>{{ $t('stats.dash2.progress.group') }}</span>
                <select v-model="selectedMuscleGroupId" @change="onGroupChange()">
                    <option v-for="mg in muscleGroups" :key="mg.id" :value="mg.id">{{ mg.name }}</option>
                </select>
            </label>

            <!-- Period of the chart and of the exercises of the group -->
            <div class="period-row">
                <select class="period-select" v-model="period" :aria-label="$t('stats.home.period')" @change="onGroupChange()">
                    <option v-for="p in periods" :key="p.key" :value="p.key">{{ $t('stats.home.periods.' + p.label) }}</option>
                </select>
                <template v-if="period === 'custom'">
                    <input type="date" class="period-date" v-model="customFrom" :aria-label="$t('stats.filters.from')" @change="onGroupChange()" />
                    <input type="date" class="period-date" v-model="customTo" :aria-label="$t('stats.filters.to')" @change="onGroupChange()" />
                </template>
            </div>

            <div v-if="groupStats?.sessions?.length" class="group-chart">
                <div class="chart-title">{{ $t('stats.dash2.progress.groupEvolution', { group: selectedGroupName }) }}</div>
                <div class="chart-wrap"><canvas id="groupVolumeCanvas"></canvas></div>
            </div>

            <div v-if="loadingGroup" class="loading-text">{{ $t('stats.muscleGroup.loading') }}</div>

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
                                        <div class="cmp-sub">{{ $t('stats.dash2.progress.avgReps', { n: parseFloat(exerciseView(ex.id).previous.avg_reps).toFixed(1) }) }}</div>
                                    </template>
                                    <div v-else class="cmp-sub">—</div>
                                </div>

                                <div class="cmp-card current">
                                    <div class="cmp-label">{{ $t('stats.dash2.progress.current') }}</div>
                                    <div class="cmp-value">{{ exerciseView(ex.id).current.max_weight }} kg</div>
                                    <div class="cmp-sub">{{ formatShortDate(exerciseView(ex.id).current.date) }} · {{ exerciseView(ex.id).current.total_sets }} {{ $t('stats.dash.last.setsShort') }}</div>
                                    <div class="cmp-sub">{{ $t('stats.dash2.progress.avgReps', { n: parseFloat(exerciseView(ex.id).current.avg_reps).toFixed(1) }) }}</div>
                                    <div class="cmp-changes" v-if="exerciseView(ex.id).previous">
                                        <span v-for="c in exerciseView(ex.id).changes" :key="c.text" class="cmp-delta" :class="c.cls">{{ c.text }}</span>
                                        <span v-if="!exerciseView(ex.id).changes.length" class="cmp-delta flat">{{ $t('stats.dash2.progress.same') }}</span>
                                    </div>
                                </div>

                                <div class="cmp-card record" v-if="exerciseView(ex.id).pr?.best_weight">
                                    <div class="cmp-label">🏆 {{ $t('stats.dash2.progress.record') }}</div>
                                    <div class="cmp-value">{{ exerciseView(ex.id).pr.best_weight.weight }} kg</div>
                                    <div class="cmp-sub">{{ exerciseView(ex.id).pr.best_weight.reps }} {{ $t('stats.dash2.progress.reps') }} · {{ formatShortDate(exerciseView(ex.id).pr.best_weight.date) }}</div>
                                </div>
                            </div>

                            <div v-if="exerciseView(ex.id).current" class="ex-charts">
                                <div class="chart-values">{{ chartValues(ex.id) }}</div>
                                <div class="chart-wrap small"><canvas id="exerciseCanvas"></canvas></div>
                                <div class="ex-chips">
                                    <button v-for="m in exMetrics" :key="m" type="button" class="ex-chip" :class="{ on: exMetric === m }"
                                        @click="setExMetric(m)">{{ $t('stats.home.metrics.' + m) }}</button>
                                </div>
                            </div>
                        </template>
                    </div>
                </div>
            </div>
        </div>
        </div>
    </AppPage>
</template>

<script lang="ts" src="./progression.ts"></script>
<style lang="scss" src="../stats/stats.scss"></style>
