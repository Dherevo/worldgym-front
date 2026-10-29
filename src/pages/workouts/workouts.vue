<template>
        <div class="workouts-page">

            <div class="page-header">
                <h1>{{ $t('workouts.title') }}</h1>
                <button class="btn-new" @click="openCreate()">{{ $t('workouts.newWorkout') }}</button>
            </div>

            <div class="filters">
                <div class="filter-group">
                    <label>{{ $t('workouts.dateFrom') }}</label>
                    <input type="date" v-model="dateFrom" @change="fetchWorkouts()" />
                </div>
                <div class="filter-group">
                    <label>{{ $t('workouts.dateTo') }}</label>
                    <input type="date" v-model="dateTo" @change="fetchWorkouts()" />
                </div>
                <button class="btn-clear" @click="dateFrom = ''; dateTo = ''; fetchWorkouts()">{{ $t('workouts.clear') }}</button>
            </div>

            <div v-if="loading" class="loading-text">{{ $t('workouts.loading') }}</div>
            <div v-else-if="workouts.length === 0" class="empty-text">{{ $t('workouts.empty') }}</div>
            <div v-else class="workout-list">
                <div
                    v-for="w in workouts"
                    :key="w.id"
                    class="workout-card"
                    @click="to('/workouts/' + w.id)"
                >
                    <div class="workout-info">
                        <div class="workout-date">
                            {{ formatDate(w.date) }}
                            <span class="duration-badge" v-if="formatDuration(w)">{{ formatDuration(w) }}</span>
                            <span class="status-badge active" v-if="w.status === 'active'">{{ $t('workouts.statusActive') }}</span>
                        </div>
                        <div class="workout-notes">{{ w.notes || $t('workouts.noNotes') }}</div>
                    </div>
                    <button class="btn-edit" @click.stop="openEdit(w)" :title="$t('workouts.edit')">✎</button>
                    <button class="btn-delete" @click.stop="deleteWorkout(w)" :title="$t('workouts.delete')">✕</button>
                    <div class="workout-arrow">&rsaquo;</div>
                </div>
            </div>

        <!-- Create / Edit modal -->
        <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
            <div class="modal">
                <h3>{{ editingWorkout ? $t('workouts.modal.editTitle') : $t('workouts.modal.newTitle') }}</h3>
                <div class="form-group">
                    <label>{{ $t('workouts.modal.date') }}</label>
                    <input type="date" v-model="editDate" />
                </div>
                <div class="form-group">
                    <label>{{ $t('workouts.modal.notes') }}</label>
                    <input type="text" v-model="editNotes" :placeholder="$t('workouts.noNotes')" />
                </div>
                <div class="modal-actions">
                    <button class="btn-cancel" @click="showModal = false">{{ $t('workouts.modal.cancel') }}</button>
                    <button class="btn-save" @click="editingWorkout ? saveEdit() : saveCreate()" :disabled="saving">
                        {{ saving ? $t('workouts.modal.saving') : $t('workouts.modal.save') }}
                    </button>
                </div>
            </div>
        </div>

        </div>
</template>

<script lang="ts" src="./workouts.ts"></script>
<style lang="scss" src="./workouts.scss"></style>
