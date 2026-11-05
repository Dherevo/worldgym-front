<template>
    <form class="food-form" @submit.prevent="save()">
        <input type="text" v-model="name" maxlength="150" :placeholder="$t('nutrition.foods.name')" />
        <div class="ff-row">
            <label>
                <span>{{ $t('nutrition.foods.unit') }}</span>
                <select v-model="unit">
                    <option value="g">g</option>
                    <option value="ml">ml</option>
                    <option value="u">{{ $t('nutrition.foods.unitOne') }}</option>
                </select>
            </label>
            <label><span>kcal {{ per }}</span><input type="number" inputmode="decimal" min="0" max="5000" step="0.1" v-model="kcal" /></label>
            <label><span>{{ $t('nutrition.foods.protein', { per }) }}</span><input type="number" inputmode="decimal" min="0" max="500" step="0.1" v-model="protein" /></label>
            <label v-if="unit === 'u'"><span>{{ $t('nutrition.foods.unitWeight') }}</span><input type="number" inputmode="decimal" min="0" step="0.1" v-model="unitG" /></label>
        </div>
        <div class="ff-actions">
            <button type="button" class="btn-link" @click="$emit('cancel')">{{ $t('nutrition.cancel') }}</button>
            <button type="submit" class="btn" :disabled="saving || !valid">{{ $t('nutrition.foods.save') }}</button>
        </div>
    </form>
</template>

<script lang="ts" src="./food-form.ts"></script>
<style lang="scss" src="./food-form.scss"></style>
