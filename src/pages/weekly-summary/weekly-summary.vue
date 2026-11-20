<template>
    <AppPage name="weekly-summary-page" layout="backoffice">
        <div class="weekly-summary">
            <header class="head">
                <button type="button" class="nav" :aria-label="$t('weekly.back')" @click="move(-1)">‹</button>
                <div class="head-title">
                    <h1>{{ $t('weekly.title') }}</h1>
                    <span class="range">{{ title }}</span>
                </div>
                <button type="button" class="nav" :disabled="offset >= 0" @click="move(1)">›</button>
            </header>

            <p class="loading" v-if="loading && !data">…</p>

            <template v-if="data">
                <section class="card">
                    <h2>{{ $t('weekly.workouts') }}</h2>
                    <div class="row" v-for="r in training" :key="r.label">
                        <span class="label">{{ r.label }}</span>
                        <span class="value">{{ r.value }}</span>
                        <span class="delta" :class="r.trend">{{ r.delta }}</span>
                    </div>
                </section>

                <section class="card">
                    <h2>{{ $t('weekly.food') }}</h2>
                    <div class="row" v-for="r in food" :key="r.label">
                        <span class="label">{{ r.label }}</span>
                        <span class="value">{{ r.value }}</span>
                        <span class="delta" :class="r.trend">{{ r.delta }}</span>
                    </div>
                    <p class="note">{{ $t('weekly.note') }}</p>
                </section>

                <section class="card">
                    <h2>{{ $t('weekly.weight') }} · {{ $t('weekly.steps') }}</h2>
                    <div class="row" v-for="r in body" :key="r.label">
                        <span class="label">{{ r.label }}</span>
                        <span class="value">{{ r.value }}</span>
                        <span class="delta" :class="r.trend">{{ r.delta }}</span>
                    </div>
                </section>

                <p class="note vs">{{ $t('weekly.vsPrev') }}</p>
            </template>
        </div>
    </AppPage>
</template>

<script lang="ts" src="./weekly-summary.ts"></script>
<style lang="scss" src="./weekly-summary.scss"></style>
