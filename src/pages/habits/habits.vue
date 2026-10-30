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

            <div v-for="(h, i) in habits" :key="h.id" class="habit-block"
                :class="{ dragging: dragFromIdx === i }"
                @dragover.prevent @drop="dropOn(i)">
            <div class="habit-row" :class="{ inactive: !h.is_active }">
                <div class="drag-handle" draggable="true" :title="$t('habits.page.dragToReorder')"
                    @dragstart="dragStart(i)" @dragend="dragEnd()">⠿</div>
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
                <button class="btn-history" :class="{ open: historyId === h.id }" @click="toggleHistory(h)">
                    {{ historyId === h.id ? $t('habits.page.history.hide') : $t('habits.page.history.show') }}
                </button>
                <button v-if="h.key === null" class="btn-delete" @click="remove(h)" :title="$t('habits.page.delete')">✕</button>
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

            <div v-if="historyId === h.id" class="history-panel">
                <div v-if="historyLoading" class="loading-text">{{ $t('habits.page.history.loading') }}</div>
                <template v-else-if="history">
                    <div class="history-stats">
                        <div class="stat"><strong>{{ history.current_streak }}</strong><span>{{ $t('habits.page.history.currentStreak') }}</span></div>
                        <div class="stat"><strong>{{ history.best_streak }}</strong><span>{{ $t('habits.page.history.bestStreak') }}</span></div>
                        <div class="stat"><strong>{{ history.completed_days }}</strong><span>{{ $t('habits.page.history.completedDays') }}</span></div>
                    </div>
                    <div class="history-title">{{ $t('habits.page.history.last30') }}</div>
                    <div class="history-grid">
                        <div v-for="c in historyCells" :key="c.date" class="cell" :class="c.state" :title="c.date">{{ c.day }}</div>
                    </div>
                    <div class="history-legend">
                        <span><i class="cell done"></i>{{ $t('habits.page.history.done') }}</span>
                        <span><i class="cell missed"></i>{{ $t('habits.page.history.missed') }}</span>
                        <span><i class="cell off"></i>{{ $t('habits.page.history.off') }}</span>
                    </div>
                </template>
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
