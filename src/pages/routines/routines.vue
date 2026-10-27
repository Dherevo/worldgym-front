<template>
    <AppPage name="routines-page" layout="backoffice">
        <div class="routines-page">

            <div class="page-header">
                <h1>{{ $t('routines.title') }}</h1>
                <button class="btn-primary" @click="openCreate()" v-if="activeTab === 'mine' || isAdmin">
                    {{ activeTab === 'templates' ? $t('routines.newTemplate') : $t('routines.newRoutine') }}
                </button>
            </div>

            <div class="tabs">
                <button :class="{ active: activeTab === 'mine' }" @click="setTab('mine')">{{ $t('routines.tabs.mine') }}</button>
                <button :class="{ active: activeTab === 'templates' }" @click="setTab('templates')">{{ $t('routines.tabs.templates') }}</button>
            </div>

            <div v-if="loading" class="loading-text">{{ $t('routines.loading') }}</div>
            <div v-else-if="routines.length === 0" class="empty-text">
                {{ activeTab === 'templates' ? $t('routines.emptyTemplates') : $t('routines.empty') }}
            </div>
            <div v-else class="routine-list">
                <div v-for="r in routines" :key="r.id" class="routine-card" :class="{ 'is-default': r.is_default }">
                    <div class="routine-info" @click="to('/routines/' + r.id)">
                        <div class="routine-name">
                            {{ r.name }}
                            <span class="badge default" v-if="r.is_default">{{ $t('routines.badgeDefault') }}</span>
                        </div>
                        <div class="routine-desc" v-if="r.description">{{ r.description }}</div>
                        <span class="badge global" v-if="r.is_global">{{ $t('routines.badgeGlobal') }}</span>
                    </div>
                    <div class="routine-actions">
                        <button @click="to('/routines/' + r.id)">{{ $t('routines.view') }}</button>
                        <button class="use-template" v-if="r.is_global" @click="cloneRoutine(r)" :disabled="cloningId === r.id">
                            {{ cloningId === r.id ? $t('routines.cloning') : $t('routines.useTemplate') }}
                        </button>
                        <button v-if="canEdit(r)" @click="openEdit(r)">{{ $t('routines.edit') }}</button>
                        <button v-if="!r.is_global && !r.is_default" @click="setDefault(r)">{{ $t('routines.makeDefault') }}</button>
                        <button v-if="canEdit(r)" class="danger" @click="deleteRoutine(r)">{{ $t('routines.delete') }}</button>
                    </div>
                </div>
            </div>

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

                    <div class="form-actions">
                        <button class="btn-cancel" @click="showForm = false">{{ $t('routines.form.cancel') }}</button>
                        <button class="btn-primary" @click="save()" :disabled="saving">
                            {{ saving ? $t('routines.form.saving') : $t('routines.form.save') }}
                        </button>
                    </div>
                </div>
            </div>

        </div>
    </AppPage>
</template>

<script lang="ts" src="./routines.ts"></script>
<style lang="scss" src="./routines.scss"></style>
