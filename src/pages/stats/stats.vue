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
                            <span class="lw-name">{{ e.name }}<span v-if="e.is_pr" class="pr-badge">PR</span></span>
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
            <button type="button" class="shortcut" @click="showCalendar = true">
                <svg-icon name="heroicons-outline/calendar-days" />
                <span>{{ $t('stats.home.calendar') }}</span>
            </button>
            <button v-for="n in 3" :key="n" type="button" class="shortcut empty" disabled>
                <span>—</span>
            </button>
        </div>

        <!-- Calendar of trained days, in a modal -->
        <div v-if="showCalendar" class="modal-overlay" @click.self="showCalendar = false">
            <div class="modal cal-modal">
                <div class="cal-modal-head">
                    <h2>{{ $t('stats.home.calendar') }}</h2>
                    <button type="button" class="cal-modal-close" :aria-label="$t('common.back')" @click="showCalendar = false">✕</button>
                </div>
        <div class="calendar-card" v-if="overview">
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

                    <div class="cal-legend">
                        <span><i class="cal-key l2"></i>{{ $t('stats.dash2.legendOne') }}</span>
                        <span><i class="cal-key l3"></i>{{ $t('stats.dash2.legendMany') }}</span>
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
            </div>
        </div>

    </div>
</template>

<script lang="ts" src="./stats.ts"></script>
<style lang="scss" src="./stats.scss"></style>
