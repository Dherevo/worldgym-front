<template>
    <div class="muscle-manager-overlay" @click.self="$emit('close')">
        <div class="muscle-manager">

            <div class="mm-header">
                <h2>{{ $t('exercises.manage.title') }}</h2>
                <button class="mm-close" @click="$emit('close')">×</button>
            </div>

            <div v-if="loading" class="mm-loading">{{ $t('exercises.manage.loading') }}</div>

            <template v-else>
                <!-- Form -->
                <div v-if="form" class="mm-form">
                    <h3>{{ formTitle }}</h3>

                    <div class="mm-field" v-for="l in locales" :key="l">
                        <label>{{ $t('exercises.manage.name') }} ({{ l.toUpperCase() }})</label>
                        <input type="text" v-model="form.names[l]" />
                    </div>

                    <div class="mm-field" v-if="form.type === 'muscle'">
                        <label>{{ $t('exercises.manage.group') }}</label>
                        <select v-model="form.muscle_group_id">
                            <option :value="null" disabled>—</option>
                            <option v-for="g in groups" :key="g.id" :value="g.id">{{ g.name }}</option>
                        </select>
                    </div>

                    <div class="mm-actions">
                        <button class="mm-btn" @click="form = null">{{ $t('exercises.manage.cancel') }}</button>
                        <button class="mm-btn primary" @click="save()" :disabled="!canSave || saving">
                            {{ saving ? $t('exercises.manage.saving') : $t('exercises.manage.save') }}
                        </button>
                    </div>
                </div>

                <!-- Groups + muscles -->
                <template v-else>
                    <div class="mm-toolbar">
                        <button class="mm-btn primary" @click="openNew('group')">{{ $t('exercises.manage.newGroup') }}</button>
                        <button class="mm-btn primary" @click="openNew('muscle')" :disabled="!groups.length">{{ $t('exercises.manage.newMuscle') }}</button>
                    </div>

                    <div v-if="!groups.length" class="mm-empty">{{ $t('exercises.manage.empty') }}</div>

                    <div v-for="g in groups" :key="g.id" class="mm-group">
                        <div class="mm-row group-row">
                            <strong>{{ g.name }}</strong>
                            <div class="mm-row-actions">
                                <button @click="openEdit('group', g)">{{ $t('exercises.manage.edit') }}</button>
                                <button class="danger" @click="remove('group', g)">{{ $t('exercises.manage.delete') }}</button>
                            </div>
                        </div>
                        <div v-for="m in musclesOf(g.id)" :key="m.id" class="mm-row muscle-row">
                            <span>{{ m.name }}</span>
                            <div class="mm-row-actions">
                                <button @click="openEdit('muscle', m)">{{ $t('exercises.manage.edit') }}</button>
                                <button class="danger" @click="remove('muscle', m)">{{ $t('exercises.manage.delete') }}</button>
                            </div>
                        </div>
                        <div v-if="!musclesOf(g.id).length" class="mm-none">{{ $t('exercises.manage.noMuscles') }}</div>
                    </div>
                </template>
            </template>

        </div>
    </div>
</template>

<script lang="ts" src="./muscle-manager.ts"></script>
<style lang="scss" src="./muscle-manager.scss"></style>
