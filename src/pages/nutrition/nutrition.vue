<template>
    <AppPage name="nutrition-page" layout="backoffice">
        <div class="nutrition-page">
            <h1><svg-icon name="awesome-solid/utensils" class="title-icon"/> {{ $t('nutrition.title') }}</h1>

            <div v-if="weighDue" class="weigh-banner">
                <span>{{ $t('nutrition.weighDue') }}</span>
                <button type="button" class="btn" @click="to('/profile')">{{ $t('nutrition.weighNow') }}</button>
            </div>

            <div class="day-nav">
                <button type="button" class="nav-btn" @click="shiftDay(-1)" :aria-label="$t('nutrition.prevDay')">‹</button>
                <span class="day-label">{{ dateLabel }}</span>
                <button type="button" class="nav-btn" @click="shiftDay(1)" :disabled="isToday" :aria-label="$t('nutrition.nextDay')">›</button>
            </div>

            <p v-if="loading && !day" class="muted">{{ $t('nutrition.loading') }}</p>

            <template v-if="day">
                <div class="card">
                    <EnergyBar v-if="day.ready" :day="day" />
                    <p v-else class="muted">{{ $t('energy.needData') }}</p>
                    <div class="protein-bar" v-if="proteinGoal">
                        <div class="protein-text">
                            <span>{{ $t('nutrition.protein', { n: Math.round(day.protein) }) }}</span>
                            <span class="muted">{{ $t('nutrition.proteinGoal', { min: proteinGoal.min, max: proteinGoal.max }) }}</span>
                        </div>
                        <div class="protein-track"><div class="protein-fill" :class="{ reached: day.protein >= proteinGoal.min }" :style="{ width: proteinPct + '%' }"></div></div>
                        <span class="muted">{{ $t('nutrition.proteinFor.' + day.goal, { min: proteinGoal.min, max: proteinGoal.max }) }}</span>
                    </div>
                    <p class="protein" v-else-if="day.protein > 0">{{ $t('nutrition.protein', { n: Math.round(day.protein) }) }}</p>
                    <p class="note">{{ $t('energy.water', { l: waterLiters }) }}</p>
                    <p class="note">{{ $t('energy.full') }}</p>
                </div>

                <div v-for="meal in meals" :key="meal" class="card meal">
                    <div class="meal-head">
                        <h2>{{ $t('nutrition.meals.' + meal) }}</h2>
                        <span class="subtotal" v-if="entriesOf(meal).length">{{ subtotal(meal) }} kcal</span>
                    </div>

                    <ul class="entries" v-if="entriesOf(meal).length">
                        <li v-for="e in entriesOf(meal)" :key="e.id">
                            <button type="button" class="entry-main" @click="openEdit(e)">
                                <span class="entry-name">{{ e.name }}</span>
                                <small v-if="e.protein_g">{{ e.protein_g }} g {{ $t('nutrition.proteinShort') }}</small>
                            </button>
                            <span class="entry-kcal">{{ e.kcal }} kcal</span>
                            <button type="button" class="entry-del" @click="remove(e)" :aria-label="$t('nutrition.delete')">✕</button>
                        </li>
                    </ul>

                    <form v-if="adding === meal" class="add-form" @submit.prevent="save()">
                        <div class="chips" v-if="!editingId && recent.length">
                            <button v-for="r in recent" :key="r.name" type="button" class="chip" @click="useRecent(r)">{{ r.name }} · {{ r.kcal }}</button>
                        </div>
                        <div v-for="(r, i) in rows" :key="i" class="form-row">
                            <input type="text" v-model="r.name" maxlength="150" :placeholder="$t('nutrition.namePlaceholder')" />
                            <div class="row">
                                <label><span>kcal</span><input type="number" inputmode="numeric" min="0" max="5000" step="1" v-model="r.kcal" /></label>
                                <label><span>{{ $t('nutrition.proteinG') }}</span><input type="number" inputmode="decimal" min="0" max="500" step="0.1" v-model="r.protein" /></label>
                                <button v-if="rows.length > 1" type="button" class="row-del" @click="removeRow(i)" :aria-label="$t('nutrition.delete')">✕</button>
                            </div>
                        </div>
                        <button v-if="!editingId" type="button" class="btn-add" @click="addRow()">+ {{ $t('nutrition.addRow') }}</button>
                        <div class="form-actions">
                            <button type="button" class="btn-link" @click="adding = null">{{ $t('nutrition.cancel') }}</button>
                            <button type="submit" class="btn" :disabled="saving || !canSave">{{ editingId ? $t('nutrition.update') : $t('nutrition.add') }}</button>
                        </div>
                    </form>
                    <button v-else type="button" class="btn-add" @click="openAdd(meal)">+ {{ $t('nutrition.addTo', { meal: $t('nutrition.meals.' + meal).toLowerCase() }) }}</button>
                </div>

                <div class="card" v-if="history.length">
                    <h2>{{ $t('nutrition.history') }}</h2>
                    <ul class="history">
                        <li v-for="h in history" :key="h.date" :class="{ active: h.date === date }" role="button" tabindex="0" @click="openDay(h.date)" @keyup.enter="openDay(h.date)">
                            <span class="h-date">{{ historyLabel(h.date) }}</span>
                            <span>{{ h.kcal }} <small>{{ $t('nutrition.eatenShort') }}</small></span>
                            <span>{{ h.energy ? h.energy.burned : '—' }} <small>{{ $t('nutrition.burnedShort') }}</small></span>
                            <span class="h-balance" :class="{ deficit: (balance(h) ?? 1) <= 0 }">{{ balanceLabel(h) }}</span>
                        </li>
                    </ul>
                </div>
            </template>
        </div>
    </AppPage>
</template>

<script lang="ts" src="./nutrition.ts"></script>
<style lang="scss" src="./nutrition.scss"></style>
