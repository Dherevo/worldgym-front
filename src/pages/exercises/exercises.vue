<template>
        <div class="exercises-page">

            <div class="page-header">
                <h1>{{ $t('exercises.title') }}</h1>
                <div class="header-buttons">
                    <button class="btn-primary" @click="openCreate()">{{ $t('exercises.newExercise') }}</button>
                </div>
            </div>

            <!-- Tabs -->
            <div class="tabs">
                <button :class="{ active: activeTab === 'all' }" @click="setTab('all')">{{ $t('exercises.tabs.all') }}</button>
                <button :class="{ active: activeTab === 'global' }" @click="setTab('global')">{{ $t('exercises.tabs.global') }}</button>
                <button :class="{ active: activeTab === 'mine' }" @click="setTab('mine')">{{ $t('exercises.tabs.mine') }}</button>
            </div>

            <!-- Filters -->
            <div class="filters">
                <input
                    type="text"
                    v-model="searchQuery"
                    :placeholder="$t('exercises.filters.searchPlaceholder')"
                    @input="onFilterChange()"
                />
                <select v-model="muscleGroupId" @change="onMuscleGroupChange()">
                    <option value="">{{ $t('exercises.filters.allMuscleGroups') }}</option>
                    <option v-for="mg in muscleGroups" :key="mg.id" :value="mg.id">{{ mg.name }}</option>
                </select>
                <select v-model="muscleId" @change="onFilterChange()" :disabled="!muscleGroupId">
                    <option value="">{{ $t('exercises.filters.allMuscles') }}</option>
                    <option v-for="m in filteredMuscles" :key="m.id" :value="m.id">{{ m.name }}</option>
                </select>
                <label v-if="muscleGroupId || muscleId" class="toggle-secondary">
                    <input type="checkbox" v-model="primaryOnly" @change="onPrimaryOnlyChange()" />
                    {{ $t('exercises.filters.primaryOnly') }}
                </label>
                <select v-model="equipmentId" @change="onFilterChange()">
                    <option value="">{{ $t('exercises.filters.allEquipment') }}</option>
                    <option v-for="eq in equipments" :key="eq.id" :value="eq.id">{{ eq.name }}</option>
                </select>
            </div>

            <!-- List -->
            <div v-if="loading" class="loading-text">{{ $t('exercises.loading') }}</div>
            <div v-else-if="exercises.length === 0" class="empty-text">{{ $t('exercises.empty') }}</div>
            <div v-else class="exercise-list">
                <div v-for="ex in exercises" :key="ex.id" class="exercise-card">
                    <div class="exercise-main" @click="openDetail(ex)">
                        <img v-if="ex.gif_url" class="exercise-thumb" :src="ex.gif_url" :alt="ex.name" loading="lazy" />
                        <div class="exercise-info">
                            <div class="exercise-name">{{ ex.name }}</div>
                            <div class="exercise-meta">
                                <span v-if="ex.is_bodyweight">{{ $t('exercises.bodyweight') }}</span>
                                <span v-else-if="ex.equipment">{{ ex.equipment.name }}</span>
                                <span v-if="ex.muscles?.length"> · {{ primaryMuscles(ex) }}</span>
                                <span class="badge global" v-if="ex.is_global">{{ $t('exercises.badgeGlobal') }}</span>
                                <span class="badge bw" v-if="ex.is_bodyweight">{{ $t('exercises.badgeBodyweight') }}</span>
                            </div>
                        </div>
                    </div>
                    <div class="exercise-actions" v-if="canEdit(ex)">
                        <button @click="openEdit(ex)">{{ $t('exercises.edit') }}</button>
                        <button class="danger" @click="deleteExercise(ex)">{{ $t('exercises.delete') }}</button>
                    </div>
                </div>
            </div>

            <!-- Paginador -->
            <div class="paginator" v-if="!loading && total > pageSize">
                <button @click="prevPage()" :disabled="!hasPrev">&larr;</button>
                <span class="page-info">{{ $t('exercises.pageInfo', { page: currentPage, pages: totalPages }) }} <small>{{ $t('exercises.totalExercises', { n: total }) }}</small></span>
                <button @click="nextPage()" :disabled="!hasNext">&rarr;</button>
            </div>

            <!-- Detail Modal -->
            <div v-if="detailExercise" class="modal-overlay" @click.self="detailExercise = null">
                <div class="modal detail-modal">
                    <h2>{{ detailExercise.name }}</h2>
                    <div class="detail-meta">
                        <span v-if="detailExercise.is_bodyweight">{{ $t('exercises.bodyweight') }}</span>
                        <span v-else-if="detailExercise.equipment">{{ detailExercise.equipment.name }}</span>
                        <span v-if="detailExercise.muscles?.length"> · {{ primaryMuscles(detailExercise) }}</span>
                    </div>
                    <template v-if="detailExercise.gif_url">
                        <img class="detail-gif" :src="detailExercise.gif_url" :alt="detailExercise.name" width="180" height="180" />
                        <div class="detail-credit">
                            {{ $t('exercises.detail.gifCredit') }}
                            <a href="https://gymvisual.com/" target="_blank" rel="noopener">Gym visual</a>
                        </div>
                    </template>
                    <div v-if="detailExercise.description" class="detail-description">
                        <h3>{{ $t('exercises.detail.instructions') }}</h3>
                        <p>{{ detailExercise.description }}</p>
                    </div>
                    <div v-else-if="!detailExercise.gif_url" class="empty-text">{{ $t('exercises.detail.noInfo') }}</div>
                    <div class="form-actions">
                        <button class="btn-cancel" @click="detailExercise = null">{{ $t('exercises.detail.close') }}</button>
                    </div>
                </div>
            </div>

            <!-- Form Modal -->
            <div v-if="showForm" class="modal-overlay" @click.self="showForm = false">
                <div class="modal">
                    <h2>{{ editingExercise ? $t('exercises.form.titleEdit') : $t('exercises.form.titleNew') }}</h2>

                    <div class="form-group lang-block" v-for="l in locales" :key="l">
                        <label>
                            <span class="lang-tag">{{ l.toUpperCase() }}</span>
                            {{ $t('exercises.form.name') }}
                        </label>
                        <input type="text" v-model="texts[l].name" :placeholder="$t('exercises.form.namePlaceholder')" />
                        <textarea v-model="texts[l].description" :placeholder="$t('exercises.form.descriptionPlaceholder')" rows="3"></textarea>
                    </div>
                    <div class="form-hint">{{ $t('exercises.form.langHint') }}</div>

                    <div class="form-group">
                        <label>{{ $t('exercises.form.image') }}</label>
                        <div class="gif-field">
                            <img v-if="gifPreview" class="gif-preview" :src="gifPreview" alt="" />
                            <div class="gif-buttons">
                                <label class="btn-file">
                                    {{ $t('exercises.form.imageChoose') }}
                                    <input type="file" accept="image/gif,image/png,image/jpeg,image/webp" @change="onGifPicked($event)" hidden />
                                </label>
                                <button v-if="gifPreview" type="button" class="btn-cancel" @click="clearGif()">{{ $t('exercises.form.imageRemove') }}</button>
                            </div>
                        </div>
                    </div>

                    <div class="form-group">
                        <label class="check-row">
                            <input type="checkbox" v-model="form.is_bodyweight" />
                            {{ $t('exercises.form.isBodyweight') }}
                        </label>
                    </div>

                    <div class="form-group">
                        <label>{{ $t('recommendation.tags.intensity') }}</label>
                        <select v-model.number="form.intensity">
                            <option :value="1">{{ $t('recommendation.tags.low') }}</option>
                            <option :value="2">{{ $t('recommendation.tags.medium') }}</option>
                            <option :value="3">{{ $t('recommendation.tags.high') }}</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>{{ $t('recommendation.tags.type') }}</label>
                        <select v-model="form.type">
                            <option value="strength">{{ $t('recommendation.tags.strength') }}</option>
                            <option value="cardio">{{ $t('recommendation.tags.cardio') }}</option>
                            <option value="mobility">{{ $t('recommendation.tags.mobility') }}</option>
                            <option value="stretch">{{ $t('recommendation.tags.stretch') }}</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>{{ $t('recommendation.tags.impact') }}</label>
                        <select v-model="form.impact">
                            <option value="low">{{ $t('recommendation.tags.impactLow') }}</option>
                            <option value="high">{{ $t('recommendation.tags.impactHigh') }}</option>
                        </select>
                    </div>

                    <div class="form-group" v-if="!form.is_bodyweight">
                        <label>{{ $t('exercises.form.equipment') }}</label>
                        <select v-model="form.equipment_id">
                            <option :value="null">{{ $t('exercises.form.noEquipment') }}</option>
                            <option v-for="eq in equipments" :key="eq.id" :value="eq.id">{{ eq.name }}</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label>{{ $t('exercises.form.muscles') }}</label>
                        <div class="muscles-grid">
                            <div v-for="m in muscles" :key="m.id" class="muscle-item">
                                <label class="muscle-check">
                                    <input
                                        type="checkbox"
                                        :checked="isMuscleSelected(m.id)"
                                        @change="toggleMuscle(m.id)"
                                    />
                                    {{ m.name }}
                                    <span class="muscle-group-tag">{{ m.muscle_group?.name }}</span>
                                </label>
                                <select
                                    v-if="isMuscleSelected(m.id)"
                                    :value="getMuscleIsPrimary(m.id)"
                                    @change="setMusclePrimary(m.id, $event.target.value === 'true')"
                                >
                                    <option value="true">{{ $t('exercises.form.primary') }}</option>
                                    <option value="false">{{ $t('exercises.form.secondary') }}</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div class="form-actions">
                        <button class="btn-cancel" @click="showForm = false">{{ $t('exercises.form.cancel') }}</button>
                        <button class="btn-primary" @click="saveExercise()" :disabled="savingExercise || !hasName">
                            {{ savingExercise ? $t('exercises.form.saving') : $t('exercises.form.save') }}
                        </button>
                    </div>
                </div>
            </div>

        </div>
</template>

<script lang="ts" src="./exercises.ts"></script>
<style lang="scss" src="./exercises.scss"></style>
