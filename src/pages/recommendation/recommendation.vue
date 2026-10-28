<template>
    <AppPage name="recommendation-page" layout="backoffice">
        <div class="recommendation-page">

            <div class="page-header">
                <h1>{{ $t('recommendation.title') }}</h1>
                <p class="sub">{{ $t('recommendation.sub') }}</p>
            </div>

            <CheckIn @saved="onFilterChange()" />

            <div class="controls">
                <div class="control">
                    <span class="control-label">{{ $t('recommendation.place') }}</span>
                    <div class="toggle">
                        <button :class="{ selected: location === 'gym' }" @click="location = 'gym'; onFilterChange()">{{ $t('recommendation.gym') }}</button>
                        <button :class="{ selected: location === 'home' }" @click="location = 'home'; onFilterChange()">{{ $t('recommendation.home') }}</button>
                    </div>
                </div>
                <div class="control">
                    <span class="control-label">{{ $t('recommendation.minutes') }}</span>
                    <select v-model.number="minutes" @change="onFilterChange()">
                        <option v-for="m in minuteOptions" :key="m" :value="m">{{ m }} {{ $t('recommendation.minutesUnit') }}</option>
                    </select>
                </div>
            </div>

            <div v-if="loading && !proposal" class="loading-text">{{ $t('recommendation.loading') }}</div>

            <template v-else-if="proposal">
                <div class="proposal" :class="{ refreshing: loading }">

                    <div class="proposal-head">
                        <span class="level-badge" :class="'level-' + proposal.level">
                            {{ $t('recommendation.level') }}: {{ $t('recommendation.levels.' + proposal.level) }}
                        </span>
                        <span class="estimate" v-if="proposal.exercises.length">{{ $t('recommendation.estimated', { n: proposal.estimated_minutes }) }}</span>
                    </div>

                    <div class="empty" v-if="!proposal.exercises.length">{{ $t('recommendation.empty') }}</div>

                    <div class="why" v-if="proposal.reasons.length">
                        <div class="why-title">{{ $t('recommendation.why') }}</div>
                        <ul>
                            <li v-for="r in proposal.reasons" :key="r">{{ $t('recommendation.reasons.' + r) }}</li>
                        </ul>
                    </div>

                    <div class="exercise" v-for="e in proposal.exercises" :key="e.exercise.id">
                        <img v-if="e.exercise.gif_url" class="gif" :src="e.exercise.gif_url" :alt="e.exercise.name" width="56" height="56" />
                        <div class="exercise-body">
                            <div class="exercise-name">{{ e.exercise.name }}</div>
                            <div class="exercise-meta">
                                {{ e.sets }} × {{ e.reps }} · {{ $t('recommendation.rest') }} {{ e.rest_seconds }}s
                                <template v-if="e.weight_target"> · {{ e.weight_target }} kg</template>
                                <template v-if="e.exercise.equipment"> · {{ e.exercise.equipment }}</template>
                            </div>
                        </div>
                    </div>

                    <div class="actions">
                        <button class="btn-start" :disabled="starting || !proposal.exercises.length" @click="start()">
                            {{ starting ? $t('recommendation.starting') : $t('recommendation.start') }}
                        </button>
                        <button class="btn-another" :disabled="loading" @click="anotherProposal()">{{ $t('recommendation.another') }}</button>
                    </div>
                </div>
            </template>

            <p class="note">{{ $t('recommendation.note') }}</p>
        </div>
    </AppPage>
</template>

<script lang="ts" src="./recommendation.ts"></script>
<style lang="scss" src="./recommendation.scss"></style>
