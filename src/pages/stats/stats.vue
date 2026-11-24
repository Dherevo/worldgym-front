<template>
    <div class="stats-page">

        <div class="page-header">
            <h1>{{ $t('stats.title') }}</h1>
        </div>

        <!-- Hours trained: period dropdown, chart and streaks -->
        <div class="section-card time-card">
            <div class="time-head">
                <div>
                    <div class="time-label">{{ $t('stats.home.hoursTitle') }}</div>
                    <div class="time-total">{{ totalLabel }}</div>
                </div>
                <select class="period-select" v-model="period" :aria-label="$t('stats.home.hoursTitle')">
                    <option v-for="p in periods" :key="p.key" :value="p.key">{{ $t('stats.home.periods.' + p.label) }}</option>
                </select>
            </div>

            <div v-if="loadingTime && !timeData" class="loading-text">{{ $t('stats.overview.loading') }}</div>
            <div v-else class="chart-wrap time-chart"><canvas ref="timeCanvas"></canvas></div>

            <div class="streaks" v-if="timeData">
                <div class="streak">
                    <span class="streak-label">{{ $t('stats.home.streakCurrent') }}</span>
                    <b>🔥 {{ timeData.streak.current_weeks }}</b>
                    <small>{{ $t('stats.home.weeks') }}</small>
                </div>
                <div class="streak">
                    <span class="streak-label">{{ $t('stats.home.streakBest') }}</span>
                    <b>🏆 {{ timeData.streak.best_weeks }}</b>
                    <small>{{ $t('stats.home.weeks') }}</small>
                </div>
            </div>
        </div>

        <!-- Last workout: closed until opened -->
        <SectionTile v-if="overview?.last_workouts?.length" accordion v-model:open="lastOpen"
            :title="$t('stats.dash.last.title')" :status="formatShortDate(overview.last_workouts[0].date)">
    <div class="last-workout">
                <div class="lw-head">
                    <button type="button" class="lw-nav" :disabled="lastIndex >= overview.last_workouts.length - 1"
                        :aria-label="$t('stats.dash2.olderWorkout')" @click="selectLast(lastIndex + 1)">&lsaquo;</button>

                    <div class="lw-title">
                        <h2>{{ lastIndex === 0 ? $t('stats.dash.last.title') : $t('stats.dash2.previousWorkout') }}</h2>
                        <div class="lw-sub">{{ formatHistoryDate(lastMeta.date) }}<template v-if="lastMeta.day_name"> · {{ lastMeta.day_name }}</template></div>
                        <div class="lw-dots">
                            <button v-for="(w, i) in overview.last_workouts" :key="w.id" type="button" class="lw-dot" :class="{ on: i === lastIndex }"
                                :aria-label="formatHistoryDate(w.date)" @click="selectLast(i)"></button>
                        </div>
                    </div>

                    <button type="button" class="lw-nav" :disabled="lastIndex <= 0"
                        :aria-label="$t('stats.dash2.newerWorkout')" @click="selectLast(lastIndex - 1)">&rsaquo;</button>
                </div>

                <div v-if="!lw" class="loading-text">{{ $t('stats.overview.loading') }}</div>
                <template v-else>
                <div class="lw-totals">
                    <div class="lw-total" v-if="improvement.comparable">
                        <b>{{ improvement.up }}/{{ improvement.comparable }}</b>
                        <span>{{ $t('stats.dash2.improved') }}</span>
                    </div>
                    <div class="lw-total"><b>{{ lw.sets }}</b><span>{{ $t('stats.dash.last.sets') }}</span></div>
                    <div class="lw-total"><b>{{ lw.exercises_count }}</b><span>{{ $t('stats.dash.last.exercises') }}</span></div>
                    <div class="lw-total" v-if="lw.prs"><b>🏆 {{ lw.prs }}</b><span>{{ $t('stats.dash.last.records') }}</span></div>
                </div>

                <p class="lw-compare" v-if="lw.compared_with">
                    {{ comparedText(lw) }}
                </p>

                <div class="lw-list">
                    <div v-for="e in lw.exercises" :key="e.id" class="lw-row">
                        <div class="lw-line">
                            <span class="lw-name exercise-link" @click="to('/exercise/' + e.id)">{{ e.name }}<span v-if="e.is_pr" class="pr-badge">PR</span></span>
                            <span class="lw-changes">
                                <span v-if="e.prev_max_weight === null" class="lw-delta flat">{{ $t('stats.dash.last.first') }}</span>
                                <template v-else>
                                    <span v-for="c in lastChanges(e)" :key="c.text" class="lw-delta" :class="c.cls">{{ c.text }}</span>
                                    <span v-if="!lastChanges(e).length" class="lw-delta flat">{{ $t('stats.dash2.progress.same') }}</span>
                                </template>
                            </span>
                        </div>
                        <div class="lw-meta">{{ e.sets }} {{ $t('stats.dash.last.setsShort') }} · {{ e.max_weight }} kg × {{ e.top_reps }}</div>
                    </div>
                </div>
                <button type="button" class="lw-open" @click="to('/workouts/' + lw.id)">{{ $t('stats.dash.last.open') }} &rsaquo;</button>
                </template>
            </div>
        </SectionTile>

        <!-- Shortcuts -->
        <div class="shortcuts">
            <button type="button" class="shortcut" @click="to('/calendar')">
                <svg-icon name="heroicons-outline/calendar-days" />
                <span>{{ $t('stats.home.calendar') }}</span>
            </button>
            <button type="button" class="shortcut" @click="to('/workouts')">
                <svg-icon name="heroicons-outline/clock" />
                <span>{{ $t('stats.home.history') }}</span>
            </button>
            <button type="button" class="shortcut" @click="to('/progression')">
                <svg-icon name="heroicons-outline/chart-bar" />
                <span>{{ $t('stats.home.progression') }}</span>
            </button>
            <button type="button" class="shortcut" @click="to('/habit-progress')">
                <svg-icon name="heroicons-outline/check-circle" />
                <span>{{ $t('layout.menu.habits') }}</span>
            </button>
        </div>

    </div>
</template>

<script lang="ts" src="./stats.ts"></script>
<style lang="scss" src="./stats.scss"></style>
