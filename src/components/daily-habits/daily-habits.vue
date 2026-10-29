<template>
    <SectionTile v-model:open="open" :title="$t('habits.card.title')" :status="statusLabel" :tone="allDone ? 'done' : 'pending'">
        <div class="daily-habits">
            <div class="dh-head">
                <a class="dh-link" @click.prevent="to('/habits')" href="/habits">{{ $t('habits.card.configure') }}</a>
            </div>

            <div class="dh-tip" v-if="tip">{{ tip }}</div>

            <div v-if="loading && !habits.length" class="dh-loading">{{ $t('habits.card.loading') }}</div>

            <div v-for="h in habits" :key="h.id" class="habit" :class="{ done: h.log?.completed }">
                <button class="check" :disabled="savingId === h.id"
                    :title="h.log?.completed ? $t('habits.card.markUndone') : $t('habits.card.markDone')"
                    @click="toggle(h)">✓</button>

                <div class="habit-body">
                    <div class="habit-title">
                        <span class="habit-name">{{ habitName(h) }}</span>
                        <span class="habit-goal" v-if="goalLabel(h)">{{ $t('habits.card.goal') }}: {{ goalLabel(h) }}</span>
                    </div>

                    <div class="habit-inputs" v-if="h.kind === 'steps'">
                        <input type="number" inputmode="numeric" min="0" max="100000" step="100"
                            v-model="drafts[h.id].value" @change="saveSteps(h)" @keyup.enter="saveSteps(h)" />
                        <span>{{ $t('habits.card.steps') }}</span>
                    </div>

                    <div class="habit-inputs" v-else-if="h.kind === 'sets'">
                        <input type="number" inputmode="numeric" min="0" max="50"
                            v-model="drafts[h.id].sets" @change="saveSets(h)" @keyup.enter="saveSets(h)" />
                        <span>{{ $t('habits.card.sets') }} ×</span>
                        <input type="number" inputmode="numeric" min="0" max="500"
                            v-model="drafts[h.id].reps" @change="saveSets(h)" @keyup.enter="saveSets(h)" />
                        <span>{{ $t('habits.card.reps') }}</span>
                    </div>

                    <div class="bar" v-if="h.kind !== 'check'">
                        <div class="fill" :style="{ width: progress(h) + '%' }"></div>
                    </div>
                </div>
            </div>
        </div>
    </SectionTile>
</template>

<script lang="ts" src="./daily-habits.ts"></script>
<style lang="scss" src="./daily-habits.scss"></style>
