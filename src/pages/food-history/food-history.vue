<template>
    <div class="food-history-page">
        <div class="fh-head">
            <h1>{{ $t('nutrition.cal.title') }}</h1>
        </div>

        <div class="fh-nav">
            <button type="button" class="fh-arrow" :aria-label="$t('nutrition.cal.prevMonth')" @click="shiftMonth(-1)"><svg-icon name="heroicons-outline/chevron-left" /></button>
            <span class="fh-month">{{ monthLabel }}</span>
            <button type="button" class="fh-arrow" :disabled="!canNext" :aria-label="$t('nutrition.cal.nextMonth')" @click="shiftMonth(1)"><svg-icon name="heroicons-outline/chevron-right" /></button>
        </div>

        <div class="fh-summary">
            <div><b>{{ summary.logged }}</b><small>{{ $t('nutrition.cal.logged') }}</small></div>
            <div><b>{{ summary.avgKcal || '—' }}</b><small>{{ $t('nutrition.cal.avgKcal') }}</small></div>
            <div><b>{{ summary.avgProtein || '—' }}</b><small>{{ $t('nutrition.cal.avgProtein') }}</small></div>
            <div><b>{{ summary.proteinDays === null ? '—' : summary.proteinDays }}</b><small>{{ $t('nutrition.cal.proteinDays') }}</small></div>
        </div>

        <div class="fh-cal" :class="{ loading }">
            <span v-for="w in weekdays" :key="w" class="fh-wd">{{ w }}</span>
            <template v-for="(c, i) in cells" :key="i">
                <span v-if="!c" class="fh-empty"></span>
                <button v-else type="button" class="fh-day" :class="[c.state, { today: c.today, future: c.future }]" :disabled="c.future" @click="openDay(c.date)">
                    <span class="fh-num">{{ c.day }}</span>
                    <span class="fh-kcal">{{ c.kcal || '' }}</span>
                </button>
            </template>
        </div>

        <ul class="fh-legend">
            <li><i class="ok"></i>{{ $t('nutrition.cal.state.ok') }}</li>
            <li><i class="over"></i>{{ $t('nutrition.cal.state.over') }}</li>
            <li><i class="low"></i>{{ $t('nutrition.cal.state.low') }}</li>
            <li><i class="none"></i>{{ $t('nutrition.cal.state.none') }}</li>
        </ul>
        <p class="fh-hint">{{ $t('nutrition.cal.hint') }}</p>

        <div class="fh-list" v-if="rows.length">
            <h2>{{ $t('nutrition.cal.listTitle') }}</h2>
            <button v-for="r in rows" :key="r.date" type="button" class="fh-row" :class="{ today: r.today }" @click="openDay(r.date)">
                <span class="fh-rdate">{{ r.label }}</span>
                <span class="fh-rnum"><b>{{ r.eaten || '—' }}</b><small>{{ $t('nutrition.eatenShort') }}</small></span>
                <span class="fh-rnum"><b>{{ r.burned ?? '—' }}</b><small>{{ $t('nutrition.burnedShort') }}</small></span>
                <span class="fh-rnum"><b>{{ r.protein || '—' }}</b><small>{{ $t('nutrition.proteinShort') }}</small></span>
                <span class="fh-rbal" :class="{ minus: r.balance !== null && r.balance < 0, plus: r.balance !== null && r.balance > 0 }">{{ r.balance === null ? '' : (r.balance > 0 ? '+' : '') + r.balance }}</span>
            </button>
        </div>
    </div>
</template>

<script lang="ts" src="./food-history.ts"></script>
<style lang="scss" src="./food-history.scss"></style>
