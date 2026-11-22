<template>
        <div class="measurements-page">

            <div class="page-header">
                <div>
                    <h1>{{ $t('measurements.title') }}</h1>
                    <p class="sub">{{ $t('measurements.sub') }}</p>
                </div>
                <button class="btn-new" @click="openCreate()">{{ $t('measurements.add') }}</button>
            </div>

            <div v-if="loading && !items.length" class="loading-text">{{ $t('measurements.loading') }}</div>

            <div v-else-if="!items.length" class="empty-card">
                <h3>{{ $t('measurements.emptyTitle') }}</h3>
                <p>{{ $t('measurements.emptyText') }}</p>
            </div>

            <template v-else>
                <div class="summary">
                    <div class="stat-card">
                        <div class="stat-label">{{ $t('measurements.cards.weight') }}</div>
                        <div class="stat-value">{{ latest.weight_kg }} kg</div>
                        <div class="stat-hint">{{ formatDate(latest.date) }}</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label">{{ $t('measurements.cards.bmi') }}</div>
                        <div class="stat-value">{{ bmi ?? $t('measurements.cards.noBmi') }}</div>
                        <span v-if="bmiCategory" class="badge" :class="bmiCategory">{{ $t('measurements.category.' + bmiCategory) }}</span>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label">{{ $t('measurements.cards.change') }}</div>
                        <div class="stat-value">{{ totalChange }}</div>
                    </div>
                    <div class="stat-card" v-if="heightCm">
                        <div class="stat-label">{{ $t('measurements.cards.height') }}</div>
                        <div class="stat-value">{{ heightCm }} cm</div>
                    </div>
                </div>

                <div class="chart-block">
                    <div class="chart-title">{{ $t('measurements.charts.weightBmi') }}</div>
                    <canvas id="measurementsWeightCanvas"></canvas>
                </div>

                <div class="chart-block" v-if="waistItems.length > 1">
                    <div class="chart-title">{{ $t('measurements.charts.waist') }}</div>
                    <canvas id="measurementsWaistCanvas"></canvas>
                </div>

                <div class="mt-list">
                    <div class="mt-row mt-head">
                        <span>{{ $t('measurements.table.date') }}</span>
                        <span>{{ $t('measurements.table.weight') }}</span>
                        <span>{{ $t('measurements.table.waist') }}</span>
                        <span>{{ $t('measurements.table.bmi') }}</span>
                    </div>
                    <SwipeRow v-for="m in tableRows" :key="m.id" class="mt-swipe" @edit="openEdit(m)" @delete="remove(m)">
                        <div class="mt-row">
                            <span>{{ formatDate(m.date) }}</span>
                            <span>{{ m.weight_kg }}</span>
                            <span>{{ m.waist_cm ?? '—' }}</span>
                            <span>{{ m.bmi ?? '—' }}</span>
                        </div>
                    </SwipeRow>
                </div>
            </template>

            <p class="note">{{ $t('measurements.note') }}</p>

            <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
                <div class="modal">
                    <h3>{{ editingId ? $t('measurements.modal.editTitle') : $t('measurements.modal.newTitle') }}</h3>
                    <div class="form-group">
                        <label>{{ $t('measurements.modal.date') }}</label>
                        <input type="date" v-model="date" :max="todayStr" />
                    </div>
                    <div class="form-group">
                        <label>{{ $t('measurements.modal.weight') }}</label>
                        <input type="number" inputmode="decimal" min="30" max="300" step="0.1" v-model="weight" />
                    </div>
                    <div class="form-group">
                        <label>{{ $t('measurements.modal.waist') }}</label>
                        <input type="number" inputmode="decimal" min="30" max="250" step="0.1" v-model="waist" />
                    </div>
                    <div class="modal-actions">
                        <button class="btn-cancel" @click="showModal = false">{{ $t('measurements.modal.cancel') }}</button>
                        <button class="btn-save" :disabled="saving || !valid" @click="save()">
                            {{ saving ? $t('measurements.modal.saving') : $t('measurements.modal.save') }}
                        </button>
                    </div>
                </div>
            </div>

        </div>
</template>

<script lang="ts" src="./measurements.ts"></script>
<style lang="scss" src="./measurements.scss"></style>
