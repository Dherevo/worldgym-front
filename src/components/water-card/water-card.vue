<template>
    <div class="water-card">
        <section class="card wc-card">
            <div class="wc-head">
                <h2>💧 {{ $t('nutrition.water.title') }}</h2>
                <button type="button" class="wc-open" @click="openSheet()">+ {{ $t('nutrition.water.log') }}</button>
            </div>
            <template v-if="day">
                <p class="wc-big"><b>{{ day.total_ml }}</b> <span class="wc-muted">/ {{ day.goal_ml }} ml · {{ pct }}%</span></p>
                <div class="wc-track"><div class="wc-fill" :class="{ done: day.total_ml >= day.goal_ml }" :style="{ width: Math.min(100, pct) + '%' }"></div></div>
            </template>
            <p v-else class="wc-muted">{{ $t('nutrition.loading') }}</p>
        </section>

        <div v-if="open" class="wc-backdrop" @click.self="closeSheet()">
            <div class="wc-sheet" role="dialog" aria-modal="true">
                <div class="wc-sheet-head">
                    <button type="button" class="wc-icon" :aria-label="$t('nutrition.close')" @click="closeSheet()">✕</button>
                    <button type="button" class="wc-icon" :aria-label="$t('nutrition.water.goalEdit')" @click="toggleGoal()">⚙</button>
                </div>
                <h2>{{ $t('nutrition.water.sheetTitle') }}</h2>

                <div v-if="editingGoal" class="wc-goal-form">
                    <label>
                        <span>{{ $t('nutrition.water.goalLabel') }}</span>
                        <input type="number" inputmode="numeric" min="500" max="10000" step="50" v-model="goalInput" @keyup.enter="saveGoal()" />
                    </label>
                    <div class="wc-row">
                        <button v-if="day?.custom" type="button" class="wc-link" :disabled="busy" @click="resetGoal()">{{ $t('nutrition.water.goalReset') }}</button>
                        <button type="button" class="wc-btn" :disabled="busy || !goalValid" @click="saveGoal()">{{ $t('nutrition.water.goalSave') }}</button>
                    </div>
                </div>

                <div class="wc-total">
                    <small>{{ $t('nutrition.water.pending') }}</small>
                    <b>{{ pending }} ml</b>
                </div>
                <p class="wc-muted wc-goal">{{ $t('nutrition.water.goal', { n: day?.goal_ml ?? 0 }) }} · {{ $t('nutrition.water.today', { n: day?.total_ml ?? 0 }) }}</p>

                <div class="wc-quick">
                    <button v-for="q in quick" :key="q" type="button" @click="pending += q">
                        <span class="wc-glass">💧</span>
                        <span>{{ q }} ml</span>
                        <span class="wc-plus">+</span>
                    </button>
                    <div class="wc-custom">
                        <span class="wc-glass">🍶</span>
                        <input type="number" inputmode="numeric" min="1" max="5000" step="10" v-model="customMl" :placeholder="$t('nutrition.water.custom')" @keyup.enter="addCustom()" />
                        <button type="button" class="wc-plus" :disabled="!customValid" :aria-label="$t('nutrition.water.custom')" @click="addCustom()">+</button>
                    </div>
                </div>

                <button type="button" class="wc-btn wc-save" :disabled="busy || pending <= 0" @click="save()">{{ $t('nutrition.water.save') }}</button>
                <button v-if="pending > 0" type="button" class="wc-link wc-clear" @click="pending = 0">{{ $t('nutrition.water.clear') }}</button>

                <ul v-if="day?.entries.length" class="wc-list">
                    <li v-for="e in day.entries" :key="e.id">
                        <span>{{ e.ml }} ml</span>
                        <button type="button" class="wc-icon" :aria-label="$t('nutrition.delete')" :disabled="busy" @click="remove(e)">✕</button>
                    </li>
                </ul>
            </div>
        </div>
    </div>
</template>

<script lang="ts" src="./water-card.ts"></script>
<style lang="scss" src="./water-card.scss"></style>
