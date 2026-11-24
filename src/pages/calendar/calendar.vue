<template>
    <AppPage name="calendar-page" layout="backoffice">
        <div class="stats-page cal-page">
            <div class="sub-top">
                <BackButton class="btn-back" @click="goBack()" />
                <h1>{{ $t('stats.home.calendar') }}</h1>
            </div>
            <div v-if="loading" class="loading-text">{{ $t('stats.overview.loading') }}</div>

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

            <div class="cal-legend">
                <span><i class="cal-key l2"></i>{{ $t('stats.dash2.legendOne') }}</span>
                <span><i class="cal-key l3"></i>{{ $t('stats.dash2.legendMany') }}</span>
            </div>

            <SectionTile v-model:open="showYear" :title="$t('stats.dash2.viewYear')">
                <!-- Last 12 months, the newest first: a small month calendar each -->
                <div class="year-grid">
                    <div v-for="m in yearMonths" :key="m.key" class="ym">
                        <div class="ym-head"><b>{{ m.label }}</b><span>{{ m.trained }}</span></div>
                        <div class="ym-dow"><i v-for="(w, wi) in weekdayLabels" :key="wi">{{ w }}</i></div>
                        <div class="ym-days">
                            <template v-for="(c, ci) in m.cells" :key="ci">
                                <i v-if="!c" class="ym-empty"></i>
                                <i v-else class="ym-day" :class="['l' + c.level, { today: c.today, future: c.future }]"
                                    :title="c.count ? $t('stats.dash.heatmap.tooltip', { date: formatHistoryDate(c.date), n: c.count }) : ''">{{ c.day }}</i>
                            </template>
                        </div>
                    </div>
                </div>
                <div class="hm-legend">
                    <span>{{ $t('stats.dash.heatmap.less') }}</span>
                    <i class="ym-key l0"></i><i class="ym-key l2"></i><i class="ym-key l3"></i>
                    <span>{{ $t('stats.dash.heatmap.more') }}</span>
                </div>
            </SectionTile>
        </div>
        </div>
    </AppPage>
</template>

<script lang="ts" src="./calendar.ts"></script>
<style lang="scss" src="../stats/stats.scss"></style>
