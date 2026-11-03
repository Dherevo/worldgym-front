<template>
    <div class="card energy-card">
        <h2>{{ $t('energy.title') }}</h2>

        <template v-if="bmr">
            <div class="energy-row">
                <div>
                    <div class="label">{{ $t('energy.bmr') }}</div>
                    <div class="hint">{{ $t('energy.bmrHint') }}</div>
                </div>
                <div class="value">≈ {{ bmr }} kcal</div>
            </div>
            <div class="energy-row">
                <div>
                    <div class="label">{{ $t('energy.base') }}</div>
                    <div class="hint">{{ $t('energy.baseHint') }}</div>
                </div>
                <div class="value">≈ {{ base }} kcal</div>
            </div>

            <h3>{{ $t('energy.goalTitle') }}</h3>
            <div class="goal-options">
                <button v-for="g in goals" :key="g" type="button" class="option" :class="{ selected: goal === g }"
                    :disabled="saving" @click="setGoal(g)">{{ $t('energy.goals.' + g) }}</button>
            </div>
            <p class="hint" v-if="isAuto">{{ $t('energy.goalAuto', { bmi: bmiLabel, goal: autoGoalLabel }) }}</p>
            <p class="hint">{{ $t('energy.goalHints.' + goal) }}</p>

            <div class="energy-row">
                <div>
                    <div class="label">{{ $t('energy.restDay') }}</div>
                    <div class="hint">{{ $t('energy.trainDayNote') }}</div>
                </div>
                <div class="value">≈ {{ restRange }} kcal</div>
            </div>

            <button type="button" class="food-link" @click="to('/nutrition')">{{ $t('energy.openFood') }} ›</button>
            <p class="fact">{{ $t('energy.fatFact') }}</p>
        </template>
        <p class="sub" v-else>{{ $t('energy.needData') }}</p>

        <p class="disclaimer">{{ $t('energy.disclaimer') }}</p>
        <p class="disclaimer" v-if="bmr">{{ $t('energy.guideDisclaimer') }}</p>
    </div>
</template>

<script lang="ts" src="./energy-card.ts"></script>
<style lang="scss" src="./energy-card.scss"></style>
