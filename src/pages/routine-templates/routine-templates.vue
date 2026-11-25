<template>
    <AppPage name="routine-templates-page" layout="backoffice">
        <div class="stats-page rt-view">
            <div class="sub-top">
                <BackButton class="btn-back" @click="goBack()" />
                <h1>{{ $t('routineTemplates.title') }}</h1>
            </div>
            <p class="rt-sub">{{ $t('routineTemplates.sub') }}</p>

            <div class="rt-filters" role="tablist">
                <button type="button" role="tab" :class="{ on: filter === '' }" @click="filter = ''">{{ $t('routineTemplates.all') }}</button>
                <button v-for="t in filterTags" :key="t" type="button" role="tab" :class="{ on: filter === t }" @click="filter = t">{{ tagLabel(t) }}</button>
            </div>

            <skeleton-block v-if="loading" :rows="4" height="14rem" />
            <p v-else-if="!shown.length" class="rt-empty">{{ $t('routineTemplates.empty') }}</p>

            <div v-else class="rt-grid">
                <button v-for="r in shown" :key="r.id" type="button" class="rt-card" @click="to('/routine-templates/' + r.id)">
                    <div class="rt-cover" :data-id="r.id">
                        <exercise-animation v-if="r.cover && seen[r.id]" class="rt-anim" :exercise="r.cover" />
                        <svg-icon v-else-if="!r.cover" name="heroicons-outline/bolt" />
                    </div>
                    <div class="rt-body">
                        <span v-if="reasonsOf(r)" class="rt-badge">{{ $t('routineTemplates.forToday') }}</span>
                        <h3>{{ r.name }}</h3>
                        <p v-if="r.description" class="rt-desc">{{ r.description }}</p>
                        <p v-if="reasonsOf(r)" class="rt-why">{{ dayOf(r) }}<template v-if="dayOf(r)"> · </template>{{ reasonsOf(r) }}</p>
                        <div class="rt-meta">
                            <span>{{ $t('routineTemplates.days', { n: r.days }) }}</span>
                            <span>{{ $t('routineTemplates.exercises', { n: r.exercises }) }}</span>
                            <span>{{ $t('routineTemplates.minutes', { n: r.minutes }) }}</span>
                        </div>
                        <div class="rt-tags"><span v-for="t in r.tags.slice(0, 4)" :key="t">{{ tagLabel(t) }}</span></div>
                    </div>
                </button>
            </div>
        </div>
    </AppPage>
</template>

<script lang="ts" src="./routine-templates.ts"></script>
<style lang="scss" src="../stats/stats.scss"></style>
<style lang="scss" src="./routine-templates.scss"></style>
