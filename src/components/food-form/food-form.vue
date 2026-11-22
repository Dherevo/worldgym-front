<template>
    <form class="food-form" @submit.prevent="save()">
        <div class="ff-code">
            <input type="text" v-model="offCode" maxlength="14" inputmode="numeric" :placeholder="$t('nutrition.foods.barcode')" />
            <button type="button" class="btn-link" :disabled="!codeValid || looking" @click="lookup()">{{ looking ? $t('nutrition.off.searching') : $t('nutrition.foods.barcodeSearch') }}</button>
        </div>
        <p class="ff-hint" v-if="filled">{{ $t('nutrition.foods.barcodeFilled') }}</p>
        <p class="ff-hint" v-else>{{ $t('nutrition.foods.barcodeHint') }}</p>
        <input type="text" v-model="name" maxlength="150" :placeholder="$t('nutrition.foods.name')" />
        <input type="text" v-model="brand" maxlength="100" :placeholder="$t('nutrition.foods.brand')" />
        <div class="ff-row">
            <label>
                <span>{{ $t('nutrition.foods.unit') }}</span>
                <select v-model="unit">
                    <option value="g">g</option>
                    <option value="ml">ml</option>
                    <option value="u">{{ $t('nutrition.foods.unitOne') }}</option>
                </select>
            </label>
            <label v-if="unit !== 'u'"><span>{{ $t('nutrition.foods.refAmount', { unit }) }}</span><input type="number" inputmode="decimal" min="0" step="any" placeholder="100" v-model="refAmount" /></label>
            <label><span>kcal {{ per }}</span><input type="number" inputmode="decimal" min="0" max="5000" step="0.1" v-model="kcal" /></label>
            <label><span>{{ $t('nutrition.foods.protein', { per }) }}</span><input type="number" inputmode="decimal" min="0" max="500" step="0.1" v-model="protein" /></label>
            <label v-if="unit === 'u'"><span>{{ $t('nutrition.foods.unitWeight') }}</span><input type="number" inputmode="decimal" min="0" step="0.1" v-model="unitG" /></label>
        </div>
        <label class="ff-plant">
            <span>{{ $t('nutrition.foods.plant') }}</span>
            <select v-model="plant">
                <option value="">{{ $t('nutrition.foods.plantAuto') }}</option>
                <option value="yes">{{ $t('nutrition.foods.plantYes') }}</option>
                <option value="no">{{ $t('nutrition.foods.plantNo') }}</option>
            </select>
        </label>
        <div class="ff-cats" v-if="topCategories.length">
            <span class="ff-cats-title">{{ $t('foodAdd.categories') }}</span>
            <div v-for="c in topCategories" :key="c.id" class="ff-cat-group">
                <button type="button" class="ff-chip" :class="{ on: categoryIds.includes(c.id) }" @click="toggleCategory(c.id)">{{ catName(c) }}</button>
                <button v-for="s in childrenOf(c)" :key="s.id" type="button" class="ff-chip sub" :class="{ on: categoryIds.includes(s.id) }" @click="toggleCategory(s.id)">{{ catName(s) }}</button>
            </div>
        </div>
        <div class="ff-actions">
            <button type="button" class="btn-link" @click="$emit('cancel')">{{ $t('nutrition.cancel') }}</button>
            <button type="submit" class="btn" :disabled="saving || !valid">{{ $t('nutrition.foods.save') }}</button>
        </div>
    </form>
</template>

<script lang="ts" src="./food-form.ts"></script>
<style lang="scss" src="./food-form.scss"></style>
