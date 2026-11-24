<template>
    <AppPage name="exercise-detail-page" layout="backoffice">
        <div class="exercise-detail-page">

            <div class="ed-top">
                <BackButton class="btn-back" @click="goBack()" />
                <h1 class="ed-title">{{ exercise?.name }}</h1>
            </div>

            <div v-if="loading" class="ed-state">{{ $t('exerciseDetail.loading') }}</div>
            <div v-else-if="failed || !exercise" class="ed-state">{{ $t('exerciseDetail.notFound') }}</div>

            <template v-else>
                <nav class="ed-tabs" role="tablist">
                    <button v-for="t in tabs" :key="t" type="button" role="tab" class="ed-tab"
                        :class="{ active: tab === t }" :aria-selected="tab === t" @click="setTab(t)">
                        {{ $t('exerciseDetail.tabs.' + t) }}
                    </button>
                </nav>

                <!-- One page per tab; in the app the finger drags them side by side -->
                <SwipePager :index="tabIndex" :count="tabs.length" :enabled="isApp" @change="onPager" @neighbors="ensureChart()">
                <template #default="{ index }">
                <!-- Big animation: on the summary and the directions -->
                <exercise-animation v-if="tabs[index] !== 'history'" class="ed-media" :exercise="exercise" />

                <!-- SUMMARY -->
                <div v-if="tabs[index] === 'summary'" class="ed-body">
                    <h2 class="ed-name">{{ exercise.name }}</h2>
                    <p class="ed-eq" v-if="exercise.equipment">{{ exercise.equipment.name }}</p>
                    <p class="ed-muscles" v-if="muscles.primary">{{ $t('exerciseDetail.primary') }}: {{ muscles.primary }}</p>
                    <p class="ed-muscles" v-if="muscles.secondary">{{ $t('exerciseDetail.secondary') }}: {{ muscles.secondary }}</p>

                    <div class="ed-empty" v-if="!sessions.length">{{ $t('exerciseDetail.noData') }}</div>

                    <template v-else>
                        <div class="ed-chart-head">
                            <div class="ed-headline">{{ headline }}</div>
                            <select class="ed-range" v-model="range">
                                <option v-for="r in ranges" :key="r" :value="r">{{ $t('exerciseDetail.range.' + r) }}</option>
                            </select>
                        </div>
                        <div class="ed-chart"><canvas ref="canvas"></canvas></div>
                        <div class="ed-chips">
                            <button v-for="m in metrics" :key="m" type="button" class="ed-chip"
                                :class="{ active: metric === m }" @click="setMetric(m)">{{ $t('exerciseDetail.metric.' + m) }}</button>
                        </div>

                        <h3 class="ed-section">🏅 {{ $t('exerciseDetail.records.title') }}</h3>
                        <div class="ed-records" v-if="records">
                            <template v-if="records.bodyweight">
                                <div class="ed-record"><span>{{ $t('exerciseDetail.records.maxReps') }}</span><b>{{ records.maxReps }}</b></div>
                                <div class="ed-record"><span>{{ $t('exerciseDetail.records.sessionReps') }}</span><b>{{ records.sessionReps }}</b></div>
                            </template>
                            <template v-else>
                                <div class="ed-record"><span>{{ $t('exerciseDetail.records.maxWeight') }}</span><b>{{ records.maxWeight }} kg</b></div>
                                <div class="ed-record"><span>{{ $t('exerciseDetail.records.bestOneRm') }}</span><b>{{ records.bestOneRm ? records.bestOneRm + ' kg' : '—' }}</b></div>
                                <div class="ed-record"><span>{{ $t('exerciseDetail.records.bestSet') }}</span><b>{{ records.bestSet }}</b></div>
                                <div class="ed-record"><span>{{ $t('exerciseDetail.records.sessionVolume') }}</span><b>{{ records.sessionVolume }} kg</b></div>
                            </template>
                        </div>

                        <template v-if="repRecords.length">
                            <h3 class="ed-section">{{ $t('exerciseDetail.setRecords.title') }}</h3>
                            <table class="ed-table">
                                <thead><tr><th>{{ $t('exerciseDetail.setRecords.reps') }}</th><th>{{ $t('exerciseDetail.setRecords.best') }}</th></tr></thead>
                                <tbody>
                                    <tr v-for="r in repRecords" :key="r.reps"><td>{{ r.reps }}</td><td>{{ r.weight }} kg</td></tr>
                                </tbody>
                            </table>
                        </template>
                    </template>
                </div>

                <!-- HISTORY -->
                <div v-else-if="tabs[index] === 'history'" class="ed-body">
                    <div class="ed-empty" v-if="!sessions.length">{{ $t('exerciseDetail.noHistory') }}</div>
                    <button v-for="(s, i) in visibleSessions" :key="i" type="button" class="ed-session" @click="to('/workouts/' + s.workout_id)">
                        <div class="ed-session-head">
                            <div>
                                <div class="ed-session-title">{{ s.title || $t('exerciseDetail.workout') }}</div>
                                <div class="ed-session-date">{{ longDate(s.date) }}</div>
                            </div>
                            <span class="ed-chevron">›</span>
                        </div>
                        <div class="ed-set" v-for="(x, j) in s.sets" :key="j" :class="{ alt: j % 2 === 1 }">
                            <span class="ed-set-n">{{ j + 1 }}</span>
                            <span class="ed-set-v">{{ setLabel(x) }}</span>
                            <span class="ed-set-flag" v-if="x.is_failed">✕</span>
                            <span class="ed-set-flag" v-else-if="x.is_dropset">↓</span>
                        </div>
                    </button>
                    <button v-if="sessions.length > visibleCount" type="button" class="ed-more" @click="visibleCount += 20">
                        {{ $t('exerciseDetail.showMore', { n: sessions.length - visibleCount }) }}
                    </button>
                </div>

                <!-- DIRECTIONS -->
                <div v-else class="ed-body">
                    <h2 class="ed-name">{{ exercise.name }}</h2>
                    <ol class="ed-steps" v-if="directions.length">
                        <li v-for="(d, i) in directions" :key="i">{{ d }}</li>
                    </ol>
                    <div class="ed-empty" v-else>{{ $t('exerciseDetail.noDirections') }}</div>
                </div>
                </template>
                </SwipePager>
            </template>

        </div>
    </AppPage>
</template>

<script lang="ts" src="./exercise-detail.ts"></script>
<style lang="scss" src="./exercise-detail.scss"></style>
