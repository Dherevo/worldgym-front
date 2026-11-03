<template>
    <div class="energy-bar">
        <div class="numbers">
            <div><b>{{ day.eaten }}</b> <small>{{ $t('nutrition.eaten') }}</small></div>
            <div class="right"><b>{{ day.burned }}</b> <small>{{ $t('nutrition.burned') }}</small></div>
        </div>

        <div class="track" role="img" :aria-label="$t('nutrition.barLabel', { eaten: day.eaten, burned: day.burned })">
            <div class="goal-zone" :style="{ left: pct(day.min) + '%', width: (pct(day.max) - pct(day.min)) + '%' }"></div>
            <div class="fill" :class="state" :style="{ width: pct(day.eaten) + '%' }"></div>
        </div>

        <div class="legend">
            <span>{{ $t('nutrition.goalRange', { min: day.min, max: day.max }) }}</span>
            <span :class="state">{{ left >= 0 ? $t('nutrition.left', { n: left }) : $t('nutrition.over', { n: -left }) }}</span>
        </div>
        <div class="breakdown">
            {{ $t('nutrition.breakdown', { base: day.base, workout: day.workoutKcal }) }}<template v-if="day.stepsKcal"> {{ $t('nutrition.breakdownSteps', { n: day.stepsKcal, steps: day.steps }) }}</template>
            · {{ balance <= 0 ? $t('nutrition.deficit', { n: -balance }) : $t('nutrition.surplus', { n: balance }) }}
        </div>
    </div>
</template>

<script lang="ts" src="./energy-bar.ts"></script>
<style lang="scss" src="./energy-bar.scss"></style>
