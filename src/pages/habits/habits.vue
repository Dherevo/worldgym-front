<template>
    <AppPage name="habits-page" layout="backoffice">
        <div class="habits-page">

            <div class="page-header">
                <div>
                    <h1>{{ $t('habits.page.title') }}</h1>
                    <p class="sub">{{ $t('habits.page.sub') }}</p>
                </div>
                <button class="btn-back" @click="to('/')">{{ $t('habits.page.back') }}</button>
            </div>

            <div v-if="loading && !habits.length" class="loading-text">{{ $t('habits.card.loading') }}</div>

            <div v-for="h in habits" :key="h.id" class="habit-row" :class="{ inactive: !h.is_active }">
                <div class="habit-name">{{ habitName(h) }}</div>

                <div class="habit-fields">
                    <label v-if="h.kind === 'steps'" class="field">
                        <span>{{ $t('habits.page.stepsGoal') }}</span>
                        <input type="number" min="1000" max="100000" step="500" :value="h.target_value"
                            @change="onNumber(h, 'target_value', $event)" />
                    </label>
                    <template v-else-if="h.kind === 'sets'">
                        <label class="field">
                            <span>{{ $t('habits.page.sets') }}</span>
                            <input type="number" min="1" max="20" :value="h.target_sets" @change="onNumber(h, 'target_sets', $event)" />
                        </label>
                        <label class="field">
                            <span>{{ $t('habits.page.reps') }}</span>
                            <input type="number" min="1" max="500" :value="h.target_reps" @change="onNumber(h, 'target_reps', $event)" />
                        </label>
                    </template>
                </div>

                <label class="active-toggle">
                    <input type="checkbox" :checked="h.is_active" @change="onActive(h, $event)" />
                    {{ $t('habits.page.active') }}
                </label>
                <button v-if="h.key === null" class="btn-delete" @click="remove(h)" :title="$t('habits.page.delete')">✕</button>
            </div>

            <div class="add-card">
                <h3>{{ $t('habits.page.addTitle') }}</h3>
                <div class="add-fields">
                    <label class="field grow">
                        <span>{{ $t('habits.page.name') }}</span>
                        <input type="text" maxlength="100" v-model="newName" />
                    </label>
                    <label class="field">
                        <span>{{ $t('habits.page.kind') }}</span>
                        <select v-model="newKind">
                            <option value="sets">{{ $t('habits.page.kindSets') }}</option>
                            <option value="check">{{ $t('habits.page.kindCheck') }}</option>
                        </select>
                    </label>
                    <template v-if="newKind === 'sets'">
                        <label class="field">
                            <span>{{ $t('habits.page.sets') }}</span>
                            <input type="number" min="1" max="20" v-model="newSets" />
                        </label>
                        <label class="field">
                            <span>{{ $t('habits.page.reps') }}</span>
                            <input type="number" min="1" max="500" v-model="newReps" />
                        </label>
                    </template>
                </div>
                <button class="btn-add" :disabled="!canAdd || adding" @click="add()">
                    {{ adding ? $t('habits.page.adding') : $t('habits.page.add') }}
                </button>
            </div>

            <p class="note">{{ $t('habits.page.note') }}</p>
        </div>
    </AppPage>
</template>

<script lang="ts" src="./habits.ts"></script>
<style lang="scss" src="./habits.scss"></style>
