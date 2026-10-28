<template>
    <AppPage name="cycle-page" layout="backoffice">
        <div class="cycle-page">

            <div class="page-header">
                <div>
                    <h1>{{ $t('cycle.title') }}</h1>
                    <p class="sub">{{ $t('cycle.sub') }}</p>
                </div>
                <button class="btn-new" @click="openCreate()">{{ $t('cycle.logPeriod') }}</button>
            </div>

            <div v-if="loading && !hasData" class="loading-text">{{ $t('cycle.loading') }}</div>

            <div v-else-if="!hasData" class="empty-card">
                <h3>{{ $t('cycle.emptyTitle') }}</h3>
                <p>{{ $t('cycle.emptyText') }}</p>
            </div>

            <div v-else class="summary">
                <div class="stat-card highlight">
                    <div class="stat-label">{{ $t('cycle.cards.today') }}</div>
                    <div class="stat-value">{{ todayStatus }}</div>
                </div>
                <div class="stat-card" v-if="nextPeriod">
                    <div class="stat-label">{{ $t('cycle.cards.nextPeriod') }}</div>
                    <div class="stat-value">{{ formatDate(nextPeriod.period_start, { day: 'numeric', month: 'long' }) }}</div>
                    <div class="stat-hint">{{ relative(nextPeriod.period_start) }}</div>
                </div>
                <div class="stat-card" v-if="nextOvulation">
                    <div class="stat-label">{{ $t('cycle.cards.nextOvulation') }}</div>
                    <div class="stat-value">{{ formatDate(nextOvulation.ovulation, { day: 'numeric', month: 'long' }) }}</div>
                    <div class="stat-hint">{{ relative(nextOvulation.ovulation) }}</div>
                </div>
                <div class="stat-card" v-if="nextFertile">
                    <div class="stat-label">{{ $t('cycle.cards.nextFertile') }}</div>
                    <div class="stat-value">{{ fertileRange }}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">{{ $t('cycle.cards.avgCycle') }}</div>
                    <div class="stat-value">{{ cycleLength }} {{ $t('cycle.cards.days') }}</div>
                    <div class="stat-hint">{{ $t('cycle.cards.avgPeriod') }}: {{ periodLength }} {{ $t('cycle.cards.days') }}</div>
                </div>
            </div>

            <div class="calendar">
                <div class="calendar-head">
                    <button class="nav-btn" :aria-label="$t('cycle.prevMonth')" @click="changeMonth(-1)">&lsaquo;</button>
                    <div class="month-label">{{ monthLabel }}</div>
                    <button class="nav-btn" :aria-label="$t('cycle.nextMonth')" @click="changeMonth(1)">&rsaquo;</button>
                </div>

                <div class="grid weekdays">
                    <div v-for="w in weekdays" :key="w">{{ w }}</div>
                </div>
                <div class="grid days">
                    <div v-for="c in cells" :key="c.date" class="day"
                        :class="[c.kind, { 'out': !c.inMonth, 'today': c.isToday }]">
                        <span>{{ c.day }}</span>
                    </div>
                </div>

                <div class="legend">
                    <span class="legend-item"><i class="dot period"></i>{{ $t('cycle.legend.period') }}</span>
                    <span class="legend-item"><i class="dot predicted"></i>{{ $t('cycle.legend.predicted') }}</span>
                    <span class="legend-item"><i class="dot fertile"></i>{{ $t('cycle.legend.fertile') }}</span>
                    <span class="legend-item"><i class="dot ovulation"></i>{{ $t('cycle.legend.ovulation') }}</span>
                </div>
            </div>

            <div class="history" v-if="hasData">
                <h3>{{ $t('cycle.history') }}</h3>
                <div v-for="p in history" :key="p.id" class="history-row">
                    <span class="history-dates">{{ periodRange(p) }}</span>
                    <button class="btn-edit" @click="openEdit(p)" :title="$t('cycle.edit')">✎</button>
                    <button class="btn-delete" @click="remove(p)" :title="$t('cycle.delete')">✕</button>
                </div>
            </div>

            <p class="disclaimer">{{ $t('cycle.disclaimer') }}</p>

            <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
                <div class="modal">
                    <h3>{{ editingId ? $t('cycle.modal.editTitle') : $t('cycle.modal.newTitle') }}</h3>
                    <div class="form-group">
                        <label>{{ $t('cycle.modal.start') }}</label>
                        <input type="date" v-model="startDate" :max="todayStr" />
                    </div>
                    <div class="form-group">
                        <label>{{ $t('cycle.modal.end') }}</label>
                        <input type="date" v-model="endDate" :min="startDate" :max="todayStr" />
                    </div>
                    <div class="modal-actions">
                        <button class="btn-cancel" @click="showModal = false">{{ $t('cycle.modal.cancel') }}</button>
                        <button class="btn-save" :disabled="saving || !startDate" @click="save()">
                            {{ saving ? $t('cycle.modal.saving') : $t('cycle.modal.save') }}
                        </button>
                    </div>
                </div>
            </div>

        </div>
    </AppPage>
</template>

<script lang="ts" src="./cycle.ts"></script>
<style lang="scss" src="./cycle.scss"></style>
