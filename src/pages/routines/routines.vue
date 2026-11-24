<template>
        <div class="routines-page">

            <div class="page-header">
                <h1>{{ $t('routines.title') }}</h1>
                <button class="btn-primary" @click="openCreate()">
                    {{ $t('routines.newRoutine') }}
                </button>
            </div>

            <div v-if="loading" class="loading-text">{{ $t('routines.loading') }}</div>
            <div v-else-if="routines.length === 0" class="empty-text">
                {{ $t('routines.empty') }}
            </div>
            <div v-else class="routine-list">
                <SwipeRow v-for="r in routines" :key="r.id" :enabled="canEdit(r)" @edit="openEdit(r)" @delete="deleteRoutine(r)">
                    <div class="routine-card" :class="{ 'is-default': r.is_default }" @click="to('/routines/' + r.id)">
                        <div class="routine-info">
                            <div class="routine-name">{{ r.name }}</div>
                            <div class="routine-desc" v-if="r.description">{{ r.description }}</div>
                            <span class="badge global" v-if="r.is_global">{{ $t('routines.badgeGlobal') }}</span>
                        </div>
                        <button v-if="r.is_global" type="button" class="use-template" @click.stop="cloneRoutine(r)" :disabled="cloningId === r.id">
                            {{ cloningId === r.id ? $t('routines.cloning') : $t('routines.useTemplate') }}
                        </button>
                        <div v-else class="routine-switch" @click.stop>
                            <ion-toggle class="routine-toggle" mode="md" :checked="r.is_default" @ionChange="onActive(r, $event)" />
                            <span>{{ $t('routines.activeToggle') }}</span>
                        </div>
                    </div>
                </SwipeRow>
            </div>

            <button type="button" class="exercises-btn" @click="to('/exercises')">
                <svg-icon name="heroicons-outline/bolt" /> {{ $t('layout.menu.exercises') }}
                <svg-icon class="eb-go" name="heroicons-outline/chevron-right" />
            </button>

            <!-- Form Modal -->
            <div v-if="showForm" class="modal-overlay" @click.self="showForm = false">
                <div class="modal">
                    <h2>{{ editingRoutine ? $t('routines.form.titleEdit') : $t('routines.form.titleNew') }}</h2>

                    <div class="form-group">
                        <label>{{ $t('routines.form.name') }}</label>
                        <input type="text" v-model="form.name" :placeholder="$t('routines.form.namePlaceholder')" />
                    </div>
                    <div class="form-group">
                        <label>{{ $t('routines.form.description') }}</label>
                        <textarea v-model="form.description" rows="2" :placeholder="$t('routines.form.descriptionPlaceholder')"></textarea>
                    </div>

                    <div class="form-templates" v-if="!editingRoutine && templates.length">
                        <div class="form-templates-title">{{ $t('routines.form.fromTemplate') }}</div>
                        <div v-for="t in templates" :key="t.id" class="form-template">
                            <div>
                                <div class="routine-name">{{ t.name }}</div>
                                <div class="routine-desc" v-if="t.description">{{ t.description }}</div>
                            </div>
                            <button type="button" class="use-template" @click="cloneRoutine(t)" :disabled="cloningId === t.id">
                                {{ cloningId === t.id ? $t('routines.cloning') : $t('routines.useTemplate') }}
                            </button>
                        </div>
                    </div>

                    <div class="form-actions">
                        <button class="btn-cancel" @click="showForm = false">{{ $t('routines.form.cancel') }}</button>
                        <button class="btn-primary" @click="save()" :disabled="saving">
                            {{ saving ? $t('routines.form.saving') : $t('routines.form.save') }}
                        </button>
                    </div>
                </div>
            </div>

        </div>
</template>

<script lang="ts" src="./routines.ts"></script>
<style lang="scss" src="./routines.scss"></style>
