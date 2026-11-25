<template>
    <AppPage name="routine-template-detail-page" layout="backoffice">
        <div class="stats-page rtd-view">
            <div class="sub-top">
                <BackButton class="btn-back" @click="goBack()" />
                <h1 v-if="routine">{{ routine.name }}</h1>
            </div>

            <skeleton-block v-if="loading" :rows="3" height="10rem" />

            <template v-else-if="routine">
                <div class="rtd-hero" v-if="cover">
                    <exercise-animation class="rtd-anim" :exercise="cover" />
                </div>

                <p v-if="routine.description" class="rtd-desc">{{ routine.description }}</p>
                <div class="rtd-meta">
                    <span>{{ $t('routineTemplates.days', { n: routine.days.length }) }}</span>
                    <span>{{ $t('routineTemplates.exercises', { n: exerciseCount }) }}</span>
                    <span>{{ $t('routineTemplates.minutes', { n: minutes }) }}</span>
                </div>
                <div class="rtd-tags"><span v-for="t in tags" :key="t">{{ tagLabel(t) }}</span></div>

                <button type="button" class="rtd-use" :disabled="cloning" @click="useRoutine()">
                    {{ cloning ? $t('routineTemplates.cloning') : $t('routineTemplates.use') }}
                </button>

                <p v-if="!routine.days.length" class="rtd-empty">{{ $t('routineTemplates.noDays') }}</p>

                <!-- The days: the first one open (its animations load when it is opened) -->
                <details v-for="(day, di) in routine.days" :key="day.id" class="rtd-day" :open="di === 0" @toggle="onToggle(day, $event)">
                    <summary>
                        <span class="rtd-day-name">{{ day.name || $t('routineTemplates.day', { n: day.day_number }) }}</span>
                        <small>{{ $t('routineTemplates.exercises', { n: day.exercises.length }) }}</small>
                    </summary>
                    <ul>
                        <li v-for="ex in (opened[day.id] ? day.exercises : [])" :key="ex.id">
                            <exercise-animation v-if="ex.exercise" class="rtd-thumb" width="56" height="56" :exercise="ex.exercise" />
                            <div class="rtd-ex">
                                <span class="exercise-link" @click="to('/exercise/' + ex.exercise?.id)">{{ ex.exercise?.name }}</span>
                                <small>{{ detailOf(ex) }}</small>
                            </div>
                        </li>
                    </ul>
                </details>

                <button v-if="routine.days.length > 1" type="button" class="rtd-use" :disabled="cloning" @click="useRoutine()">
                    {{ cloning ? $t('routineTemplates.cloning') : $t('routineTemplates.use') }}
                </button>
            </template>
        </div>
    </AppPage>
</template>

<script lang="ts" src="./routine-template-detail.ts"></script>
<style lang="scss" src="../stats/stats.scss"></style>
<style lang="scss" src="./routine-template-detail.scss"></style>
