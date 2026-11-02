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
            <div class="energy-row" v-if="tdee">
                <div>
                    <div class="label">{{ $t('energy.tdee') }}</div>
                    <div class="hint">{{ $t('energy.tdeeHint', { n: perWeekLabel }) }}</div>
                </div>
                <div class="value">≈ {{ tdee }} kcal</div>
            </div>
            <p class="disclaimer" v-if="tdee">{{ $t('energy.tdeeNote') }}</p>

            <h3 v-if="tdee">{{ $t('energy.guideTitle') }}</h3>
            <div class="energy-row" v-if="tdee">
                <div>
                    <div class="label">{{ $t('energy.lose') }}</div>
                    <div class="hint">{{ $t('energy.loseHint') }}</div>
                </div>
                <div class="value">≈ {{ loseRange }} kcal</div>
            </div>
            <div class="energy-row" v-if="tdee">
                <div>
                    <div class="label">{{ $t('energy.gain') }}</div>
                    <div class="hint">{{ $t('energy.gainHint') }}</div>
                </div>
                <div class="value">≈ {{ gainRange }} kcal</div>
            </div>
            <p class="fact" v-if="tdee">{{ $t('energy.fatFact') }}</p>
        </template>
        <p class="sub" v-else>{{ $t('energy.needData') }}</p>

        <p class="disclaimer">{{ $t('energy.disclaimer') }}</p>
        <p class="disclaimer" v-if="tdee">{{ $t('energy.guideDisclaimer') }}</p>
    </div>
</template>

<script lang="ts" src="./energy-card.ts"></script>
<style lang="scss" src="./energy-card.scss"></style>
