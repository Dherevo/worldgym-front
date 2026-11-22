<template>
    <AppPage name="habits-page" layout="backoffice">
        <div class="habits-page">

            <div class="page-header">
                <div>
                    <h1>{{ $t('habits.page.title') }}</h1>
                    <p class="sub">{{ $t('habits.page.sub') }}</p>
                </div>
                <BackButton class="btn-back" :label="$t('habits.page.back')" @click="back()" />
            </div>

            <div v-if="loading && !habits.length" class="loading-text">{{ $t('habits.card.loading') }}</div>

            <div class="hp-list" v-if="listed.length">
                <div class="hp-row hp-head">
                    <span></span>
                    <span>{{ $t('habits.page.cols.habit') }}</span>
                    <span>{{ $t('habits.page.active') }}</span>
                </div>

                <div v-for="(h, i) in listed" :key="h.id" class="hp-block" :class="{ dragging: dragFromIdx === i, open: openId === h.id }"
                    @dragover.prevent @drop="dropOn(i)">
                    <SwipeRow :enabled="h.key === null" :actions="['delete']" class="hp-swipe" @delete="remove(h)">
                        <div class="hp-row" :class="{ inactive: !h.is_active }">
                            <span class="drag-handle" draggable="true" :title="$t('habits.page.dragToReorder')"
                                @dragstart="dragStart(i)" @dragend="dragEnd()">⠿</span>
                            <button type="button" class="hp-main" @click="toggleOpen(h)">
                                <span class="hp-name">{{ habitName(h) }}<i v-if="h.auto" class="hp-auto">{{ $t('habits.page.auto') }}</i></span>
                                <small class="hp-summary">{{ summary(h) }}</small>
                            </button>
                            <ion-toggle class="hp-toggle" mode="md" :checked="h.is_active" @ionChange="onActive(h, $event)" />
                        </div>
                    </SwipeRow>

                    <div v-if="openId === h.id" class="hp-edit">
                        <div class="habit-fields" v-if="h.kind === 'steps'">
                            <label class="field">
                                <span>{{ $t('habits.page.stepsGoal') }}</span>
                                <input type="number" min="1000" max="100000" step="500" :value="h.target_value" @change="onNumber(h, 'target_value', $event)" />
                            </label>
                        </div>
                        <div class="habit-fields" v-else-if="h.kind === 'sets'">
                            <label class="field">
                                <span>{{ $t('habits.page.sets') }}</span>
                                <input type="number" min="1" max="20" :value="h.target_sets" @change="onNumber(h, 'target_sets', $event)" />
                            </label>
                            <label class="field">
                                <span>{{ $t('habits.page.reps') }}</span>
                                <input type="number" min="1" max="500" :value="h.target_reps" @change="onNumber(h, 'target_reps', $event)" />
                            </label>
                        </div>

                        <div v-if="h.key === null" class="schedule-line">
                            <label class="field">
                                <span>{{ $t('habits.page.schedule.label') }}</span>
                                <select :value="h.schedule_type" @change="onScheduleType(h, $event)">
                                    <option value="daily">{{ $t('habits.page.schedule.daily') }}</option>
                                    <option value="weekdays">{{ $t('habits.page.schedule.weekdays') }}</option>
                                    <option value="interval">{{ $t('habits.page.schedule.interval') }}</option>
                                </select>
                            </label>
                            <div v-if="h.schedule_type === 'weekdays'" class="day-chips">
                                <button v-for="d in 7" :key="d" type="button" class="chip" :class="{ on: h.schedule_days.includes(d) }"
                                    @click="toggleDay(h, d)">{{ $t('habits.page.days.' + d) }}</button>
                            </div>
                            <label v-else-if="h.schedule_type === 'interval'" class="field every">
                                <span>{{ $t('habits.page.schedule.every') }}</span>
                                <input type="number" min="2" max="30" :value="h.schedule_every" @change="onEvery(h, $event)" />
                                <span>{{ $t('habits.page.schedule.days') }}</span>
                            </label>
                        </div>
                        <p class="hp-auto-note" v-if="h.auto === 'protein'">{{ $t('habits.page.autoProtein') }}</p>
                    </div>
                </div>
            </div>

            <div class="catalog-card" v-if="catalog.length">
                <h3>{{ $t('habits.page.catalog.title') }}</h3>
                <p class="catalog-sub">{{ $t('habits.page.catalog.sub') }}</p>
                <div class="catalog-item" v-for="t in catalog" :key="t.id">
                    <div class="catalog-info">
                        <div class="catalog-name">{{ t.name }}</div>
                        <div class="catalog-meta">{{ catalogGoal(t) }} · {{ catalogSchedule(t) }}</div>
                    </div>
                    <button class="btn-add" :disabled="addingCatalogId !== null" @click="addFromCatalog(t)">
                        {{ addingCatalogId === t.id ? $t('habits.page.adding') : $t('habits.page.add') }}
                    </button>
                </div>
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
                <div class="add-fields schedule-line">
                    <label class="field">
                        <span>{{ $t('habits.page.schedule.label') }}</span>
                        <select v-model="newSchedule">
                            <option value="daily">{{ $t('habits.page.schedule.daily') }}</option>
                            <option value="weekdays">{{ $t('habits.page.schedule.weekdays') }}</option>
                            <option value="interval">{{ $t('habits.page.schedule.interval') }}</option>
                        </select>
                    </label>
                    <div v-if="newSchedule === 'weekdays'" class="day-chips">
                        <button v-for="d in 7" :key="d" type="button" class="chip" :class="{ on: newDays.includes(d) }"
                            @click="toggleNewDay(d)">{{ $t('habits.page.days.' + d) }}</button>
                    </div>
                    <label v-else-if="newSchedule === 'interval'" class="field every">
                        <span>{{ $t('habits.page.schedule.every') }}</span>
                        <input type="number" min="2" max="30" v-model="newEvery" />
                        <span>{{ $t('habits.page.schedule.days') }}</span>
                    </label>
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
