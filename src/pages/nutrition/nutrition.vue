<template>
    <AppPage name="nutrition-page" layout="backoffice">
        <div class="nutrition-page">
            <h1><svg-icon name="awesome-solid/utensils" class="title-icon"/> {{ $t('nutrition.title') }}</h1>

            <button v-if="history.length" type="button" class="history-link" @click="goHistory">
                {{ $t('nutrition.historyLink') }} ↓
            </button>

            <div v-if="noPlantsAlert" class="weigh-banner plants-banner">
                <span>{{ $t('nutrition.noPlants') }}</span>
            </div>

            <div v-if="weighDue" class="weigh-banner">
                <span>{{ $t('nutrition.weighDue') }}</span>
                <button type="button" class="btn" @click="to('/profile')">{{ $t('nutrition.weighNow') }}</button>
            </div>

            <div class="day-nav">
                <button type="button" class="nav-btn" @click="shiftDay(-1)" :aria-label="$t('nutrition.prevDay')">‹</button>
                <span class="day-label">{{ dateLabel }}</span>
                <button type="button" class="nav-btn" @click="shiftDay(1)" :disabled="isToday" :aria-label="$t('nutrition.nextDay')">›</button>
            </div>

            <div class="week-strip">
                <button v-for="d in weekDays" :key="d.date" type="button" class="wk-day" :class="{ selected: d.selected, logged: d.logged }" :disabled="d.future" @click="selectDay(d.date)">
                    <span class="wk-letter">{{ d.letter }}</span>
                    <span class="wk-dot">{{ d.logged ? '✓' : '' }}</span>
                </button>
            </div>

            <p v-if="loading && !day" class="muted">{{ $t('nutrition.loading') }}</p>

            <template v-if="day">
                <div class="card kcal-card">
                    <div class="card-head">
                        <h2>{{ $t('nutrition.calories') }}</h2>
                        <button type="button" class="info-btn" :aria-label="$t('nutrition.info')" @click="infoModal = 'energy'">ⓘ</button>
                    </div>
                    <template v-if="day.ready">
                        <p class="big"><b>{{ day.eaten }}</b> <span class="muted">/ {{ day.min }} - {{ day.max }} kcal</span></p>
                        <div class="slim-track kcal-track"><div class="slim-fill" :class="kcalState" :style="{ width: kcalPct + '%' }"></div><div class="slim-mark" :style="{ left: kcalMinPct + '%' }"></div></div>
                        <p class="kcal-left" :class="kcalState">{{ day.max - day.eaten >= 0 ? $t('nutrition.left', { n: day.max - day.eaten }) : $t('nutrition.over', { n: day.eaten - day.max }) }}</p>
                    </template>
                    <p v-else class="muted">{{ $t('energy.needData') }}</p>
                </div>

                <div class="card macros-card">
                    <div class="card-head">
                        <h2>{{ $t('nutrition.macros.cardTitle') }}</h2>
                        <button type="button" class="info-btn" :aria-label="$t('nutrition.info')" @click="infoModal = 'macros'">ⓘ</button>
                    </div>
                    <div class="macro-cols">
                        <div v-for="c in macroCols" :key="c.key" class="macro-col">
                            <span class="mc-label">{{ $t('nutrition.macros.' + c.key) }}</span>
                            <span class="mc-value"><b>{{ c.noData ? '—' : c.value }}</b> <small>g</small><small v-if="c.target" class="muted"> / {{ c.target }}</small></span>
                            <div class="slim-track"><div class="slim-fill" :class="[c.key, { over: c.over, reached: c.reached }]" :style="{ width: c.pct + '%' }"></div></div>
                        </div>
                    </div>
                    <details class="macros" v-if="day.entries.length">
                        <summary>{{ $t('nutrition.macros.more') }}</summary>
                        <div v-if="macroMore" class="macro-bars">
                            <div v-for="b in macroMore" :key="b.key" class="macro-bar">
                                <div class="macro-text">
                                    <span>{{ $t('nutrition.macros.' + b.key) }}: {{ b.noData ? '—' : b.value + ' ' + b.unit }}</span>
                                    <span class="muted">{{ $t(b.ceiling ? 'nutrition.macros.max' : (b.range ? 'nutrition.macros.range' : 'nutrition.macros.goal'), { n: b.target, range: b.range, unit: b.unit }) }}</span>
                                </div>
                                <div class="protein-track"><div class="protein-fill macro-fill" :class="{ over: b.over }" :style="{ width: b.pct + '%' }"></div></div>
                            </div>
                        </div>
                        <p v-else class="extras">{{ $t('nutrition.extras', { carbs: dayExtras.carbs, fiber: dayExtras.fiber, saturates: dayExtras.saturates, sodium: dayExtras.sodium }) }}</p>
                    </details>
                    <small v-if="dayExtras.missing && day.entries.length" class="muted">{{ $t('nutrition.extrasMissing', { n: dayExtras.missing }) }}</small>
                </div>

                <div v-for="meal in meals" :key="meal" class="card meal">
                    <div class="meal-head">
                        <div class="meal-title">
                            <h2>{{ $t('nutrition.meals.' + meal) }}</h2>
                            <small v-if="entriesOf(meal).length" class="meal-macros">{{ mealMacros(meal) }}</small>
                        </div>
                        <div class="meal-side">
                            <span class="subtotal" v-if="entriesOf(meal).length">{{ subtotal(meal) }} kcal</span>
                            <button v-if="entriesOf(meal).length" type="button" class="meal-menu" :class="{ active: editMeal === meal }" :title="editMeal === meal ? $t('nutrition.doneEditing') : $t('nutrition.editMeal')" :aria-label="editMeal === meal ? $t('nutrition.doneEditing') : $t('nutrition.editMeal')" @click="toggleEdit(meal)">{{ editMeal === meal ? '✓' : '⋯' }}</button>
                        </div>
                    </div>

                    <ul class="entry-list" v-if="entriesOf(meal).length">
                        <li v-for="e in entriesOf(meal)" :key="e.id">
                            <div class="e-main">
                                <span class="e-name">{{ entryParts(e).name }}</span>
                                <small class="e-sub">{{ entryParts(e).qty !== '—' ? entryParts(e).qty : '' }}<template v-if="e.protein_g"><template v-if="entryParts(e).qty !== '—'"> · </template>{{ e.protein_g }} g {{ $t('nutrition.proteinShort') }}</template></small>
                            </div>
                            <span class="e-kcal">{{ e.kcal }}</span>
                            <span class="e-actions" v-if="editMeal === meal">
                                <button type="button" class="btn-edit" @click="openEdit(e)" :title="$t('nutrition.edit')">✎</button>
                                <button type="button" class="btn-delete" @click="remove(e)" :title="$t('nutrition.delete')">✕</button>
                            </span>
                        </li>
                    </ul>

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
                            <template v-if="foodQuery.trim().length >= 2 && !foodForm">
                                <button type="button" class="btn-add" :disabled="offSearching" @click="searchOff()">🔎 {{ offSearching ? $t('nutrition.off.searching') : $t('nutrition.off.search') }}</button>
                                <p v-if="offSearched && !offResults.length" class="muted">{{ $t('nutrition.off.none') }}</p>
                                <template v-if="offResults.length">
                                    <ul class="food-list">
                                        <li v-for="p in offResults" :key="p.code">
                                            <button type="button" :disabled="offSaving" @click="pickOff(p)">
                                                <span class="f-name">{{ p.name }}<em v-if="p.brand" class="f-shared">{{ p.brand }}</em></span>
                                                <small>{{ p.kcal_100 }} kcal<template v-if="p.protein_100"> · {{ p.protein_100 }} g</template> / 100 {{ p.unit }}</small>
                                            </button>
                                        </li>
                                    </ul>
                                    <p class="muted">{{ $t('nutrition.off.hint') }}</p>
                                </template>
                            </template>
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
                                <button v-if="!editingId && (rows.length > 1 || r.food)" type="button" class="row-del" @click="removeRow(i)" :aria-label="$t('nutrition.delete')">✕</button>
                            </div>
                        </div>
                        <button v-if="!editingId" type="button" class="btn-add" @click="addRow()">+ {{ $t('nutrition.addRow') }}</button>
                        <div class="form-actions">
                            <button type="button" class="btn-link" @click="adding = null">{{ $t('nutrition.cancel') }}</button>
                            <button type="submit" class="btn" :disabled="saving || !canSave">{{ editingId ? $t('nutrition.update') : $t('nutrition.add') }}</button>
                        </div>
                    </form>
                    <template v-else>
                        <button type="button" class="btn-pill" @click="openAdd(meal)">+ {{ $t('nutrition.addTo', { meal: $t('nutrition.meals.' + meal).toLowerCase() }) }}</button>
                        <button v-if="!entriesOf(meal).length" type="button" class="btn-add" :disabled="copying" @click="copyPrevious(meal)">⎘ {{ $t('nutrition.copyPrev') }}</button>
                    </template>
                </div>

                <div class="card" id="history-card" v-if="history.length">
                    <h2>{{ $t('nutrition.history') }}</h2>
                    <p class="muted">{{ $t('nutrition.historyHint') }}</p>
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

                <details class="card weight-card fold">
                    <summary>{{ $t('nutrition.weightCard.title') }}</summary>
                    <template v-if="weightTrend">
                        <p class="w-big">{{ weightTrend.latest }} kg <small class="muted">· {{ historyLabel(weightTrend.date) }}</small></p>
                        <p v-if="weightTrend.perWeek !== null">{{ $t('nutrition.weightCard.real', { n: kgLabel(weightTrend.perWeek) }) }}</p>
                        <p v-else class="muted">{{ $t('nutrition.weightCard.needMore') }}</p>
                        <p v-if="expectedPerWeek !== null">{{ $t('nutrition.weightCard.expected', { n: kgLabel(expectedPerWeek), kcal: Math.round(avgDeficit) }) }}</p>
                        <p v-if="weightVerdict" class="w-verdict" :class="weightVerdict">{{ $t('nutrition.weightCard.verdict.' + weightVerdict) }}</p>
                    </template>
                    <p v-else class="muted">{{ $t('nutrition.weightCard.empty') }}</p>
                    <button type="button" class="btn-add" @click="to('/measurements')">+ {{ $t('nutrition.weightCard.log') }}</button>
                </details>

                <details class="card foods-card fold">
                    <summary>{{ $t('nutrition.foods.title') }}</summary>
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
                </details>
            </template>

            <div v-if="infoModal" class="modal-backdrop" @click.self="infoModal = null">
                <div class="modal-box" role="dialog" aria-modal="true">
                    <button type="button" class="modal-close" :aria-label="$t('nutrition.close')" @click="infoModal = null">✕</button>
                    <template v-if="infoModal === 'energy' && day">
                        <EnergyBar v-if="day.ready" :day="day" />
                        <p class="note">{{ $t('energy.water', { l: waterLiters }) }}</p>
                    </template>
                    <template v-else-if="infoModal === 'macros' && day">
                        <p v-if="proteinGoal">{{ $t('nutrition.protein', { n: Math.round(day.protein) }) }} · {{ $t('nutrition.proteinGoal', { min: proteinGoal.min, max: proteinGoal.max }) }}</p>
                        <p v-if="proteinGoal" class="muted">{{ $t('nutrition.proteinFor.' + day.goal, { min: proteinGoal.min, max: proteinGoal.max }) }}</p>
                        <p class="muted">{{ $t('nutrition.macros.how') }}</p>
                    </template>
                    <p class="note">{{ $t('energy.full') }}</p>
                </div>
            </div>

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
