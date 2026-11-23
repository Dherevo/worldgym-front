<template>
    <AppPage name="food-add-page" layout="backoffice">
        <div class="food-add-page">
            <header class="fa-head">
                <BackButton class="fa-back" :label="''" @click="back()" />
                <div class="fa-meal">
                    <select v-model="meal" :aria-label="$t('foodAdd.meal')">
                        <option v-for="m in meals" :key="m" :value="m">{{ $t('nutrition.meals.' + m) }}</option>
                    </select>
                    <small v-if="dateLabel" class="muted">{{ dateLabel }}</small>
                </div>
            </header>

            <SearchInput class="fa-search" v-model="query" @input="onQuery()" :placeholder="$t('foodAdd.search')" />

            <div class="fa-segrow">
                <div class="fa-seg" role="tablist">
                    <button type="button" role="tab" :class="{ on: tab === 'all' }" @click="selectTab('all')">{{ $t('foodAdd.tabs.all') }}</button>
                    <button type="button" role="tab" :class="{ on: tab === 'mine' }" @click="selectTab('mine')">{{ $t('foodAdd.tabs.mine') }}</button>
                </div>
                <button v-if="tab === 'all'" type="button" class="fa-filter-btn" :class="{ on: showFilters || filtersActive }" :aria-label="$t('foodAdd.filters.title')" @click="showFilters = !showFilters">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 5h18l-7 8v6l-4-2v-4z"/></svg>
                    <i v-if="filtersActive" class="fa-dot"></i>
                </button>
            </div>

            <form v-if="showFilters && tab === 'all'" class="fa-filters" @submit.prevent="applyFilters()">
                <p class="muted">{{ $t('foodAdd.filters.hint') }}</p>
                <label class="fa-f-wide"><span>{{ $t('foodAdd.filters.brand') }}</span><input v-model="filters.brand" type="text" maxlength="60" placeholder="Hacendado" /></label>
                <label><span>{{ $t('foodAdd.filters.proteinMin') }}</span><input v-model="filters.protein_min" type="number" min="0" inputmode="decimal" /></label>
                <label><span>{{ $t('foodAdd.filters.kcalMax') }}</span><input v-model="filters.kcal_max" type="number" min="0" inputmode="decimal" /></label>
                <label><span>{{ $t('foodAdd.filters.carbsMax') }}</span><input v-model="filters.carbs_max" type="number" min="0" inputmode="decimal" /></label>
                <label><span>{{ $t('foodAdd.filters.fatMax') }}</span><input v-model="filters.fat_max" type="number" min="0" inputmode="decimal" /></label>
                <div class="fa-f-actions fa-f-wide">
                    <button type="button" class="fa-f-clear" @click="clearFilters()">{{ $t('foodAdd.filters.clear') }}</button>
                    <button type="submit" class="fa-f-apply">{{ $t('foodAdd.filters.apply') }}</button>
                </div>
            </form>

            <nav class="fa-tabs" role="tablist">
                <button type="button" role="tab" :class="{ on: tab === 'meals' }" @click="selectTab('meals')">{{ $t('foodAdd.tabs.meals') }}</button>
                <button type="button" role="tab" :class="{ on: tab === 'recipes' }" @click="selectTab('recipes')">{{ $t('foodAdd.tabs.recipes') }}</button>
                <button v-for="c in topCats" :key="c.id" type="button" role="tab" :class="{ on: tab === 'cat:' + c.id }" @click="selectTab('cat:' + c.id)">{{ catName(c) }}</button>
            </nav>

            <div v-if="subCats.length" class="fa-subs">
                <button type="button" :class="{ on: sub === null }" @click="selectSub(null)">{{ $t('foodAdd.allSubs') }}</button>
                <button v-for="s in subCats" :key="s.id" type="button" :class="{ on: sub === s.id }" @click="selectSub(s.id)">{{ catName(s) }}</button>
            </div>

            <div v-if="!isTemplateTab" class="fa-actions">
                <button v-if="isApp" type="button" class="fa-big" :disabled="scanning" @click="scanFood()">
                    <span class="fa-icon">▥</span>
                    <span>{{ $t('foodAdd.scan') }}</span>
                </button>
                <button type="button" class="fa-big" @click="openFoodForm()">
                    <span class="fa-icon">＋</span>
                    <span>{{ $t('foodAdd.newFood') }}</span>
                </button>
            </div>
            <div v-else class="fa-actions">
                <button type="button" class="fa-big" @click="openBuilder(null)">
                    <span class="fa-icon">＋</span>
                    <span>{{ tab === 'recipes' ? $t('foodAdd.tpl.newRecipe') : $t('foodAdd.tpl.newMeal') }}</span>
                </button>
            </div>

            <!-- Foods -->
            <template v-if="!isTemplateTab">
                <section v-if="suggested.length">
                    <h2>{{ $t('foodAdd.suggestions') }}</h2>
                    <ul class="fa-list">
                        <li v-for="f in suggested" :key="'s' + f.id">
                            <SwipeRow :enabled="tab === 'mine'" :actions="isAdmin ? ['share', 'edit', 'delete'] : ['edit', 'delete']" @share="shareFood(f)" @edit="editFood(f)" @delete="removeFood(f)">
                                <button type="button" class="fa-row" @click="openSheet(f)">
                                    <img v-if="f.image_url" class="fa-thumb" :src="f.image_url" alt="" loading="lazy" />
                                    <span v-else class="fa-thumb fa-thumb-empty">🍽</span>
                                    <span class="fa-main">
                                        <span class="fa-name">{{ f.name }}<em v-if="addedFoods.includes(f.id)" class="fa-check">✓</em></span>
                                        <small>{{ f.kcal_100 }} kcal · {{ perLabel(f) }}<template v-if="f.brand"> · {{ f.brand }}</template><em v-if="isNatural(f)" class="fa-natural"> · ✓ {{ $t('foodAdd.natural') }}</em></small>
                                    </span>
                                    <span class="fa-plus">+</span>
                                </button>
                            </SwipeRow>
                        </li>
                    </ul>
                </section>

                <section v-if="listed.length">
                    <h2 v-if="suggested.length">{{ $t('foodAdd.foods') }}</h2>
                    <ul class="fa-list">
                        <li v-for="f in listed" :key="f.id">
                            <SwipeRow :enabled="tab === 'mine'" :actions="isAdmin ? ['share', 'edit', 'delete'] : ['edit', 'delete']" @share="shareFood(f)" @edit="editFood(f)" @delete="removeFood(f)">
                                <button type="button" class="fa-row" @click="openSheet(f)">
                                    <img v-if="f.image_url" class="fa-thumb" :src="f.image_url" alt="" loading="lazy" />
                                    <span v-else class="fa-thumb fa-thumb-empty">🍽</span>
                                    <span class="fa-main">
                                        <span class="fa-name">{{ f.name }}<em v-if="addedFoods.includes(f.id)" class="fa-check">✓</em></span>
                                        <small>{{ f.kcal_100 }} kcal · {{ perLabel(f) }}<template v-if="f.brand"> · {{ f.brand }}</template><em v-if="isNatural(f)" class="fa-natural"> · ✓ {{ $t('foodAdd.natural') }}</em></small>
                                    </span>
                                    <span class="fa-plus">+</span>
                                </button>
                            </SwipeRow>
                        </li>
                    </ul>
                </section>

                <p v-if="!loading && !foods.length && !(tab === 'all' && (query.trim().length >= 2 || filtersActive))" class="muted">{{ tab === 'mine' && !query.trim() ? $t('foodAdd.emptyMine') : $t('foodAdd.empty') }}</p>
                <button v-if="hasMore" type="button" class="fa-more" :disabled="loading" @click="loadFoods(false)">{{ $t('foodAdd.more') }}</button>

                <section v-if="tab === 'all' && (query.trim().length >= 2 || filtersActive) && !loading && !hasMore" class="fa-off">
                    <h2 v-if="offShown.length || offSearching">{{ $t('foodAdd.offHeading') }}</h2>
                    <p v-if="offSearching" class="muted fa-loading"><span class="fa-spin"></span>{{ $t('foodAdd.searching') }}</p>
                    <div ref="offEnd" class="fa-end"></div>
                    <p v-if="offSearched && !offResults.length && !offSearching && !foods.length" class="muted">{{ $t('foodAdd.offNone') }}</p>
                    <ul v-if="offShown.length" class="fa-list">
                        <li v-for="p in offShown" :key="p.code">
                            <button type="button" class="fa-row" :class="{ 'fa-busy': offPicking === p.code }" :disabled="offSaving" @click="pickOff(p)">
                                <img v-if="p.image" class="fa-thumb" :src="p.image" alt="" loading="lazy" />
                                <span v-else class="fa-thumb fa-thumb-empty">🍽</span>
                                <span class="fa-main">
                                    <span class="fa-name">{{ p.name }}</span>
                                    <small v-if="offPicking === p.code">{{ $t('foodAdd.loadingFood') }}</small>
                                    <small v-else>{{ p.kcal_100 }} kcal · {{ $t('foodAdd.per100', { unit: p.unit }) }}<template v-if="p.brand"> · {{ p.brand }}</template></small>
                                </span>
                                <span v-if="offPicking === p.code" class="fa-spin"></span>
                                <span v-else class="fa-plus">+</span>
                            </button>
                        </li>
                    </ul>
                </section>
            </template>

            <!-- Meals and recipes -->
            <template v-else>
                <ul v-if="templates.length" class="fa-list">
                    <li v-for="t in templates" :key="t.id" class="fa-tpl">
                        <button type="button" class="fa-row" @click="openTplSheet(t)">
                            <span class="fa-main">
                                <span class="fa-name">{{ t.name }}<em v-if="addedTemplates.includes(t.id)" class="fa-check">✓</em></span>
                                <small>{{ t.kcal }} kcal<template v-if="t.kind === 'recipe'"> {{ $t('foodAdd.tpl.perServing') }}</template> · {{ $t('foodAdd.tpl.items', { n: t.items.length }) }}</small>
                            </span>
                            <span class="fa-plus">+</span>
                        </button>
                        <button type="button" class="fa-edit" :aria-label="$t('foodAdd.tpl.edit')" @click="openBuilder(t)">✎</button>
                    </li>
                </ul>
                <p v-else-if="!loading" class="muted">{{ tab === 'recipes' ? $t('foodAdd.tpl.emptyRecipes') : $t('foodAdd.tpl.emptyMeals') }}</p>
            </template>

            <!-- New food: a sheet, so it opens in sight whatever the length of the list -->
            <div v-if="foodForm" class="fa-backdrop" @click.self="foodForm = null">
                <div class="fa-sheet" role="dialog" aria-modal="true">
                    <h2>{{ foodForm.food ? $t('nutrition.foods.edit') : $t('foodAdd.newFood') }}</h2>
                    <FoodForm class="fa-foodform" :food="foodForm.food" :presetName="foodForm.preset" :presetCode="foodForm.code" @saved="onFoodSaved" @cancel="foodForm = null" />
                </div>
            </div>

            <!-- Amount of a food -->
            <div v-if="sheet" class="fa-backdrop" @click.self="sheet = null">
                <div class="fa-sheet" role="dialog" aria-modal="true">
                    <img v-if="sheet.food.image_url" class="fa-photo" :src="sheet.food.image_url" alt="" />
                    <h2>{{ sheet.food.name }}</h2>
                    <p v-if="sheet.food.brand" class="muted">{{ sheet.food.brand }}</p>
                    <label class="fa-field">
                        <span>{{ $t('foodAdd.meal') }}</span>
                        <select v-model="meal">
                            <option v-for="m in meals" :key="m" :value="m">{{ $t('nutrition.meals.' + m) }}</option>
                        </select>
                    </label>
                    <label class="fa-field">
                        <span>{{ $t('foodAdd.sheet.quantity') }} ({{ unitLabel(sheet.food) }})</span>
                        <input type="number" inputmode="decimal" min="0" step="any" v-model="sheet.amount" @keyup.enter="confirmSheet()" />
                    </label>
                    <div class="fa-ringrow">
                        <svg class="fa-ring" viewBox="0 0 64 64" aria-hidden="true">
                            <circle class="bg" cx="32" cy="32" r="26" />
                            <circle v-for="seg in ringSegs" :key="seg.key" :class="seg.key" cx="32" cy="32" r="26" :stroke-dasharray="seg.dash" :stroke-dashoffset="seg.offset" transform="rotate(-90 32 32)" />
                        </svg>
                        <div class="fa-ringkcal"><b>{{ sheetMacros.kcal }}</b><small>{{ $t('foodAdd.sheet.kcal') }}</small></div>
                        <div class="fa-split">
                            <div v-for="s in macroSplit" :key="s.key" :class="s.key">
                                <small class="fa-pct">{{ s.pct }}%</small>
                                <b>{{ s.grams ?? '—' }} g</b>
                                <small>{{ $t('foodAdd.sheet.' + s.key) }}</small>
                            </div>
                        </div>
                    </div>
                    <div v-if="goalBars.length" class="fa-goals">
                        <h3>{{ $t('foodAdd.sheet.goalsTitle') }}</h3>
                        <div v-for="b in goalBars" :key="b.key" class="fa-goal" :class="[b.key, { over: b.over }]">
                            <div class="fa-goal-text"><span>{{ $t('foodAdd.sheet.' + b.key) }}</span><span>{{ b.value }} / {{ b.goal }} {{ b.unit }} · {{ b.total }}%</span></div>
                            <div class="fa-goal-track"><div class="eaten" :style="{ width: b.pctEaten + '%' }"></div><div class="add" :style="{ width: b.pctAdd + '%' }"></div></div>
                        </div>
                    </div>
                    <div class="fa-sheet-actions">
                        <button type="button" class="btn-link" @click="sheet = null">{{ $t('nutrition.cancel') }}</button>
                        <button type="button" class="btn" :disabled="saving || factor <= 0" @click="confirmSheet()">{{ $t('foodAdd.sheet.add') }}</button>
                    </div>
                </div>
            </div>

            <!-- Servings of a meal or recipe -->
            <div v-if="tplSheet" class="fa-backdrop" @click.self="tplSheet = null">
                <div class="fa-sheet" role="dialog" aria-modal="true">
                    <h2>{{ tplSheet.t.name }}</h2>
                    <p class="muted">{{ tplSheet.t.kcal }} kcal<template v-if="tplSheet.t.kind === 'recipe'"> {{ $t('foodAdd.tpl.perServing') }}</template> · {{ $t('foodAdd.tpl.items', { n: tplSheet.t.items.length }) }}</p>
                    <label class="fa-field">
                        <span>{{ $t('foodAdd.meal') }}</span>
                        <select v-model="meal">
                            <option v-for="m in meals" :key="m" :value="m">{{ $t('nutrition.meals.' + m) }}</option>
                        </select>
                    </label>
                    <label class="fa-field">
                        <span>{{ tplSheet.t.kind === 'recipe' ? $t('foodAdd.tpl.servingsEaten') : $t('foodAdd.tpl.multiplier') }}</span>
                        <input type="number" inputmode="decimal" min="0.1" max="100" step="any" v-model="tplSheet.servings" @keyup.enter="confirmTpl()" />
                    </label>
                    <div class="fa-sheet-actions">
                        <button type="button" class="btn-link" @click="tplSheet = null">{{ $t('nutrition.cancel') }}</button>
                        <button type="button" class="btn" :disabled="saving" @click="confirmTpl()">{{ $t('foodAdd.tpl.eat') }}</button>
                    </div>
                </div>
            </div>

            <!-- Builder of a meal or recipe -->
            <div v-if="builder" class="fa-backdrop" @click.self="builder = null">
                <div class="fa-sheet fa-builder" role="dialog" aria-modal="true">
                    <h2>{{ builder.id ? $t('foodAdd.tpl.edit') : (builder.kind === 'recipe' ? $t('foodAdd.tpl.newRecipe') : $t('foodAdd.tpl.newMeal')) }}</h2>
                    <label class="fa-field">
                        <span>{{ $t('foodAdd.tpl.name') }}</span>
                        <input type="text" maxlength="150" v-model="builder.name" />
                    </label>
                    <div class="fa-two">
                        <label class="fa-field">
                            <span>{{ $t('foodAdd.tpl.kind') }}</span>
                            <select v-model="builder.kind">
                                <option value="meal">{{ $t('foodAdd.tpl.kindMeal') }}</option>
                                <option value="recipe">{{ $t('foodAdd.tpl.kindRecipe') }}</option>
                            </select>
                        </label>
                        <label v-if="builder.kind === 'recipe'" class="fa-field">
                            <span>{{ $t('foodAdd.tpl.servings') }}</span>
                            <input type="number" inputmode="decimal" min="0.5" max="100" step="any" v-model="builder.servings" />
                        </label>
                    </div>

                    <h3>{{ $t('foodAdd.tpl.foods') }} <small class="muted">· {{ builderKcal }} kcal<template v-if="builder.kind === 'recipe'"> {{ $t('foodAdd.tpl.perServing') }}</template></small></h3>
                    <ul v-if="builder.items.length" class="fa-items">
                        <li v-for="(it, i) in builder.items" :key="i">
                            <span class="fa-name">{{ it.name }}</span>
                            <small>{{ it.kcal }} kcal</small>
                            <button type="button" class="fa-edit" :aria-label="$t('nutrition.delete')" @click="removeBuilderItem(i)">✕</button>
                        </li>
                    </ul>
                    <p v-else class="muted">{{ $t('foodAdd.tpl.noItems') }}</p>

                    <SearchInput v-model="bQuery" @input="onBuilderQuery()" :placeholder="$t('foodAdd.tpl.searchFood')" />
                    <ul v-if="bResults.length && !bPick" class="fa-list fa-mini">
                        <li v-for="f in bResults" :key="f.id">
                            <button type="button" class="fa-row" @click="pickBuilderFood(f)">
                                <span class="fa-main"><span class="fa-name">{{ f.name }}</span><small>{{ f.kcal_100 }} kcal · {{ perLabel(f) }}</small></span>
                                <span class="fa-plus">+</span>
                            </button>
                        </li>
                    </ul>
                    <div v-if="bPick" class="fa-pick">
                        <strong>{{ bPick.food.name }}</strong>
                        <label class="fa-field">
                            <span>{{ $t('foodAdd.sheet.quantity') }} ({{ unitLabel(bPick.food) }})</span>
                            <input type="number" inputmode="decimal" min="0" step="any" v-model="bPick.amount" @keyup.enter="addBuilderItem()" />
                        </label>
                        <button type="button" class="btn" @click="addBuilderItem()">{{ $t('foodAdd.sheet.addToMeal') }}</button>
                    </div>
                    <button type="button" class="btn-link fa-import" @click="importMeal()">⎘ {{ $t('foodAdd.tpl.importMeal') }}</button>

                    <p v-if="!builderValid" class="muted">{{ $t('foodAdd.tpl.hintName') }}</p>
                    <div class="fa-sheet-actions">
                        <button v-if="builder.id" type="button" class="btn-link fa-danger" @click="deleteBuilder()">{{ $t('foodAdd.tpl.delete') }}</button>
                        <button type="button" class="btn-link" @click="builder = null">{{ $t('foodAdd.tpl.cancel') }}</button>
                        <button type="button" class="btn" :disabled="saving || !builderValid" @click="saveBuilder()">{{ $t('foodAdd.tpl.save') }}</button>
                    </div>
                </div>
            </div>
        </div>
    </AppPage>
</template>

<script lang="ts" src="./food-add.ts"></script>
<style lang="scss" src="./food-add.scss"></style>
