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
                    <div class="toggle toggle-places">
                        <button v-for="p in places" :key="p" :class="{ selected: place === p }" @click="place = p; onFilterChange()">{{ $t('recommendation.places.' + p) }}</button>
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
                            <li v-for="r in proposal.reasons" :key="r">{{ $t('recommendation.reasons.' + r, { groups: (proposal.rested_groups || []).join(', ') }) }}</li>
                        </ul>
                    </div>

                    <div class="exercise" v-for="e in proposal.exercises" :key="e.exercise.id">
                        <exercise-animation class="gif" width="56" height="56" :exercise="e.exercise" />
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
                        <button class="btn-another" :disabled="saving || saved || !proposal.exercises.length" @click="saveAsRoutine()">{{ saved ? $t('recommendation.save.saved') : $t('recommendation.save.button') }}</button>
                    </div>
                </div>
            </template>

            <!-- Ready-made routines that fit the same day and place -->
            <section v-if="proposal?.routines?.length" class="reco-routines">
                <h2>{{ $t('routineTemplates.routines') }}</h2>
                <p class="reco-routines-sub">{{ $t('routineTemplates.routinesSub') }}</p>
                <div v-for="r in proposal.routines" :key="r.id" class="reco-routine">
                    <button type="button" class="reco-open" @click="to('/routine-templates/' + r.id)">
                        <span class="reco-cover">
                            <exercise-animation v-if="r.cover" class="reco-anim" :exercise="r.cover" />
                        </span>
                        <span class="reco-body">
                            <b>{{ r.name }}</b>
                            <span class="reco-day">{{ routineDayLabel(r) }}</span>
                            <small>{{ $t('routineTemplates.exercises', { n: r.exercises }) }} · {{ $t('routineTemplates.minutes', { n: r.minutes }) }}</small>
                            <small class="reco-why">{{ routineWhy(r) }}</small>
                        </span>
                    </button>
                    <button type="button" class="reco-start" :disabled="starting" @click="startRoutine(r)">{{ $t('routineTemplates.startDay') }}</button>
                </div>
                <button type="button" class="btn-link" @click="to('/routine-templates')">{{ $t('routineTemplates.available') }} →</button>
            </section>

            <p class="note">{{ $t('recommendation.note') }}</p>
        </div>
    </AppPage>
</template>

<script lang="ts" src="./recommendation.ts"></script>
<style lang="scss" src="./recommendation.scss"></style>
