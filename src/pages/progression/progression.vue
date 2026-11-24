<template>
    <AppPage name="progression-page" layout="backoffice">
        <div class="stats-page progression-view">
            <div class="sub-top">
                <BackButton class="btn-back" @click="goBack()" />
                <h1>{{ $t('stats.home.progression') }}</h1>
            </div>

        <!-- Progression: muscle group -> exercise -> last time, current and record -->
        <div class="section-card progress-card">
            <label class="group-select">
                <span>{{ $t('stats.dash2.progress.group') }}</span>
                <select v-model="selectedMuscleGroupId" @change="onGroupChange()">
                    <option v-for="mg in muscleGroups" :key="mg.id" :value="mg.id">{{ mg.name }}</option>
                </select>
            </label>

            <!-- Period of the chart and of the exercises of the group -->
            <div class="period-row">
                <select class="period-select" v-model="period" :aria-label="$t('stats.home.period')" @change="onGroupChange()">
                    <option v-for="p in periods" :key="p.key" :value="p.key">{{ $t('stats.home.periods.' + p.label) }}</option>
                </select>
                <template v-if="period === 'custom'">
                    <input type="date" class="period-date" v-model="customFrom" :aria-label="$t('stats.filters.from')" @change="onGroupChange()" />
                    <input type="date" class="period-date" v-model="customTo" :aria-label="$t('stats.filters.to')" @change="onGroupChange()" />
                </template>
            </div>

            <div v-if="groupStats?.sessions?.length" class="group-chart">
                <div class="chart-title">{{ $t('stats.dash2.progress.groupEvolution', { group: selectedGroupName }) }}</div>
                <div class="chart-wrap"><canvas id="groupVolumeCanvas"></canvas></div>
            </div>

            <div v-if="loadingGroup" class="loading-text">{{ $t('stats.muscleGroup.loading') }}</div>

            <div v-else-if="groupStats" class="ex-list">
                <div v-if="!(groupStats.bests ?? []).length" class="empty-text">{{ $t('stats.dash2.progress.empty') }}</div>

                <div v-for="ex in (groupStats.bests ?? [])" :key="ex.id" class="ex-item">
                    <button type="button" class="ex-head" @click="openExercise(ex)">
                        <span class="ex-name">{{ ex.name }}</span>
                        <span class="ex-meta">{{ $t('stats.muscleGroup.timesTrained', { n: ex.times_trained }) }}</span>
                        <span class="ex-arrow">&rsaquo;</span>
                    </button>
                </div>
            </div>
        </div>
        </div>
    </AppPage>
</template>

<script lang="ts" src="./progression.ts"></script>
<style lang="scss" src="../stats/stats.scss"></style>
