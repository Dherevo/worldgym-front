<template>
    <div class="habits-streak section-card" v-if="rows.length">
        <h2>{{ $t('habits.streak.title') }}</h2>
        <p class="hs-sub">{{ $t('habits.streak.sub') }}</p>

        <div class="hs-stats">
            <div class="stat"><strong>🔥 {{ current }}</strong><span>{{ $t('habits.streak.current') }}</span></div>
            <div class="stat"><strong>{{ best }}</strong><span>{{ $t('habits.streak.best') }}</span></div>
            <div class="stat"><strong>{{ doneDays }}</strong><span>{{ $t('habits.streak.doneDays') }}</span></div>
        </div>

        <div class="hs-title">{{ $t('habits.streak.last30') }}</div>
        <div class="hs-grid">
            <div v-for="c in days" :key="c.date" class="cell" :class="c.state" :title="c.date">{{ c.day }}</div>
        </div>
        <div class="hs-legend">
            <span><i class="cell done"></i>{{ $t('habits.streak.legendDone') }}</span>
            <span><i class="cell partial"></i>{{ $t('habits.streak.legendPartial') }}</span>
            <span><i class="cell none"></i>{{ $t('habits.streak.legendNone') }}</span>
        </div>

        <div class="hs-title">{{ $t('habits.streak.perHabit') }}</div>
        <ul class="hs-list">
            <li v-for="r in rows" :key="r.id" :class="{ open: openId === r.id }">
                <button type="button" class="hs-row" @click="toggleRow(r.id)">
                    <span class="hs-name">{{ r.name ?? $t('habits.names.' + r.key) }}</span>
                    <span>🔥 {{ r.current }}</span>
                    <span class="hs-best">{{ $t('habits.streak.bestShort', { n: r.best }) }}</span>
                    <svg-icon class="hs-arrow" name="heroicons-outline/chevron-right" />
                </button>
                <div class="hs-detail" v-if="openId === r.id">
                    <div class="hs-detail-stats">{{ $t('habits.streak.doneShort', { n: r.done }) }}</div>
                    <div class="hs-grid">
                        <div v-for="c in r.cells" :key="c.date" class="cell" :class="c.state" :title="c.date">{{ c.day }}</div>
                    </div>
                </div>
            </li>
        </ul>
    </div>
</template>

<script lang="ts" src="./habits-streak.ts"></script>
<style lang="scss" src="./habits-streak.scss"></style>
