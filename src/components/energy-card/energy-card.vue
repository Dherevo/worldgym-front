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
        </template>
        <p class="sub" v-else>{{ $t('energy.needData') }}</p>

        <p class="disclaimer">{{ $t('energy.disclaimer') }}</p>
    </div>
</template>

<script lang="ts" src="./energy-card.ts"></script>
<style lang="scss" src="./energy-card.scss"></style>
