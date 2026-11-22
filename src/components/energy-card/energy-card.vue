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
        </template>
        <p class="sub" v-else>{{ $t('energy.needData') }}</p>

        <p class="disclaimer">{{ $t('energy.disclaimer') }}</p>
        <p class="disclaimer" v-if="bmr">{{ $t('energy.guideDisclaimer') }}</p>
    </div>
</template>

<script lang="ts" src="./energy-card.ts"></script>
<style lang="scss" src="./energy-card.scss"></style>
