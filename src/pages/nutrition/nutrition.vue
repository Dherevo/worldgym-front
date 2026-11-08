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
                        <span class="subtotal" v-if="entriesOf(meal).length">{{ subtotal(meal) }} kcal<template v-if="proteinOf(meal)"> · {{ proteinOf(meal) }} g {{ $t('nutrition.proteinShort') }}</template></span>
                    </div>

                    <div class="table-wrap" v-if="entriesOf(meal).length">
                        <table class="entries">
                            <thead>
                                <tr>
                                    <th>{{ $t('nutrition.table.name') }}</th>
                                    <th class="num">{{ $t('nutrition.table.amount') }}</th>
                                    <th class="num">kcal</th>
                                    <th class="num">{{ $t('nutrition.table.protein') }}</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="e in entriesOf(meal)" :key="e.id">
                                    <td class="entry-name">{{ entryParts(e).name }}</td>
                                    <td class="num">{{ entryParts(e).qty }}</td>
                                    <td class="num">{{ e.kcal }}</td>
                                    <td class="num">{{ e.protein_g ? e.protein_g : '—' }}</td>
                                    <td class="actions">
                                        <button type="button" class="btn-edit" @click="openEdit(e)" :title="$t('nutrition.edit')">✎</button>
                                        <button type="button" class="btn-delete" @click="remove(e)" :title="$t('nutrition.delete')">✕</button>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <form v-if="adding === meal" class="add-form" @submit.prevent="save()">
                        <div class="food-box" v-if="!editingId">
                            <input type="search" class="food-search" v-model="foodQuery" @input="onFoodQuery()" :placeholder="$t('nutrition.searchFood')" />
                            <ul class="food-list" v-if="foodResults.length">
                                <li v-for="f in foodResults" :key="f.id">
                                    <button type="button" @click="useFood(f)">
                                        <span class="f-name">{{ f.name }}<em v-if="f.shared" class="f-shared">{{ $t('nutrition.foods.shared') }}</em></span>
                                        <small>{{ f.kcal_100 }} kcal<template v-if="f.protein_100"> · {{ f.protein_100 }} g</template> {{ perLabel(f) }}</small>
                                    </button>
                                </li>
                            </ul>
                            <p v-else class="muted">{{ foodQuery.trim() ? $t('nutrition.noFood') : $t('nutrition.noFoods') }}</p>
                            <FoodForm v-if="foodForm && foodForm.where === 'add'" :food="null" :presetName="foodForm.preset" @saved="onFoodSaved" @cancel="foodForm = null" />
                            <button v-else type="button" class="btn-add" @click="openFoodForm(null, foodQuery, 'add')">+ {{ foodQuery.trim() ? $t('nutrition.createFood', { name: foodQuery.trim() }) : $t('nutrition.newFood') }}</button>
                        </div>
                        <div v-for="(r, i) in rows" :key="i" class="form-row">
                            <div v-if="r.food" class="food-line">
                                <strong>{{ r.food.name }}</strong>
                                <label class="amount"><input type="number" inputmode="decimal" min="0" step="1" v-model="r.amount" @input="onAmount(r)" :placeholder="$t('nutrition.amount')" /> <span>{{ r.food.unit === 'u' ? 'u.' : r.food.unit }}</span></label>
                            </div>
                            <input v-else type="text" v-model="r.name" maxlength="150" :placeholder="$t('nutrition.namePlaceholder')" />
                            <div class="row">
                                <label><span>kcal</span><input type="number" inputmode="numeric" min="0" max="5000" step="1" v-model="r.kcal" /></label>
                                <label><span>{{ $t('nutrition.proteinG') }}</span><input type="number" inputmode="decimal" min="0" max="500" step="0.1" v-model="r.protein" /></label>
                                <button v-if="rows.length > 1 || r.food" type="button" class="row-del" @click="removeRow(i)" :aria-label="$t('nutrition.delete')">✕</button>
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
                    <p class="muted history-protein" v-if="proteinSummary">{{ $t('nutrition.proteinSummary', { reached: proteinSummary.reached, days: proteinSummary.days, avg: proteinSummary.avg, min: proteinGoal?.min }) }}</p>
                    <ul class="history">
                        <li v-for="h in history" :key="h.date" :class="{ active: h.date === date }" role="button" tabindex="0" @click="openDay(h.date)" @keyup.enter="openDay(h.date)">
                            <span class="h-date">{{ historyLabel(h.date) }}</span>
                            <span>{{ h.kcal }} <small>{{ $t('nutrition.eatenShort') }}</small></span>
                            <span>{{ h.energy ? h.energy.burned : '—' }} <small>{{ $t('nutrition.burnedShort') }}</small></span>
                            <span class="h-protein" :class="{ ok: proteinOk(h) === true, short: proteinOk(h) === false }">{{ h.kcal ? Math.round(h.protein_g || 0) : '—' }} <small>{{ $t('nutrition.proteinShort') }}</small></span>
                            <span class="h-balance" :class="historyState(h)" :title="$t('nutrition.state.' + historyState(h))">{{ balanceLabel(h) }}</span>
                        </li>
                    </ul>
                </div>

                <div class="card weight-card">
                    <h2>{{ $t('nutrition.weightCard.title') }}</h2>
                    <template v-if="weightTrend">
                        <p class="w-big">{{ weightTrend.latest }} kg <small class="muted">· {{ historyLabel(weightTrend.date) }}</small></p>
                        <p v-if="weightTrend.perWeek !== null">{{ $t('nutrition.weightCard.real', { n: kgLabel(weightTrend.perWeek) }) }}</p>
                        <p v-else class="muted">{{ $t('nutrition.weightCard.needMore') }}</p>
                        <p v-if="expectedPerWeek !== null">{{ $t('nutrition.weightCard.expected', { n: kgLabel(expectedPerWeek), kcal: Math.round(avgDeficit) }) }}</p>
                        <p v-if="weightVerdict" class="w-verdict" :class="weightVerdict">{{ $t('nutrition.weightCard.verdict.' + weightVerdict) }}</p>
                    </template>
                    <p v-else class="muted">{{ $t('nutrition.weightCard.empty') }}</p>
                    <button type="button" class="btn-add" @click="to('/measurements')">+ {{ $t('nutrition.weightCard.log') }}</button>
                </div>

                <div class="card foods-card">
                    <h2>{{ $t('nutrition.foods.title') }}</h2>
                    <p class="muted">{{ $t('nutrition.foods.sub') }}</p>
                    <input type="search" class="food-search" v-if="myTotal > foodPageSize || myQuery" v-model="myQuery" @input="onMyQuery()" :placeholder="$t('nutrition.searchFood')" />
                    <ul class="foods-list" v-if="myFoods.length">
                        <li v-for="f in myFoods" :key="f.id">
                            <template v-if="foodForm && foodForm.where === 'card' && foodForm.food?.id === f.id">
                                <FoodForm :food="f" @saved="onFoodSaved" @cancel="foodForm = null" />
                            </template>
                            <template v-else>
                                <span class="f-main">
                                    <span class="f-name">{{ f.name }}</span>
                                    <small>{{ f.kcal_100 }} kcal<template v-if="f.protein_100"> · {{ f.protein_100 }} g {{ $t('nutrition.proteinShort') }}</template> {{ perLabel(f) }}<template v-if="f.unit_g"> · {{ f.unit_g }} g</template></small>
                                </span>
                                <button type="button" class="f-btn" @click="openFoodForm(f, '', 'card')">{{ $t('nutrition.foods.edit') }}</button>
                                <button type="button" class="entry-del" @click="removeFood(f)" :aria-label="$t('nutrition.delete')">✕</button>
                            </template>
                        </li>
                    </ul>
                    <p v-else-if="myQuery" class="muted">{{ $t('nutrition.noFood') }}</p>
                    <div class="f-pager" v-if="myTotal > foodPageSize">
                        <button type="button" :disabled="myPage <= 1" @click="shiftMyPage(-1)">‹</button>
                        <span>{{ $t('nutrition.foods.page', { page: myPage, pages: myPages }) }}</span>
                        <button type="button" :disabled="myPage >= myPages" @click="shiftMyPage(1)">›</button>
                    </div>
                    <FoodForm v-if="foodForm && foodForm.where === 'card' && !foodForm.food" :food="null" @saved="onFoodSaved" @cancel="foodForm = null" />
                    <button v-else-if="!foodForm" type="button" class="btn-add" @click="openFoodForm(null, '', 'card')">+ {{ $t('nutrition.newFood') }}</button>
                </div>
            </template>

            <details class="card calc-card">
                <summary>{{ $t('nutrition.calc.title') }}</summary>
                <h3>{{ $t('nutrition.calc.burnedTitle') }}</h3>
                <p>{{ $t('nutrition.calc.burned') }}</p>
                <h3>{{ $t('nutrition.calc.eatenTitle') }}</h3>
                <p>{{ $t('nutrition.calc.eaten') }}</p>
                <h3>{{ $t('nutrition.calc.goalTitle') }}</h3>
                <p>{{ $t('nutrition.calc.goal') }}</p>
                <h3>{{ $t('nutrition.calc.marginTitle') }}</h3>
                <p>{{ $t('nutrition.calc.margin') }}</p>
                <h3>{{ $t('nutrition.calc.weightTitle') }}</h3>
                <p>{{ $t('nutrition.calc.weight') }}</p>
                <h3>{{ $t('nutrition.calc.tipsTitle') }}</h3>
                <ul>
                    <li v-for="n in 6" :key="n">{{ $t('nutrition.calc.tip' + n) }}</li>
                </ul>
            </details>
        </div>
    </AppPage>
</template>

<script lang="ts" src="./nutrition.ts"></script>
<style lang="scss" src="./nutrition.scss"></style>
