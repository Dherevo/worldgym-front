<template>
    <div class="swipe-row" :class="{ plain: !enabled }">
        <div class="sr-main"><slot /></div>
        <div v-if="enabled" class="sr-actions">
            <button v-if="has('share')" type="button" class="sr-btn share" :aria-label="$t('common.share')" @click.stop="$emit('share')">
                <svg-icon name="heroicons-outline/arrow-up-on-square" /><span>{{ $t('common.share') }}</span>
            </button>
            <button v-if="has('edit')" type="button" class="sr-btn edit" :aria-label="$t('common.edit')" @click.stop="$emit('edit')">
                <svg-icon name="heroicons-outline/pencil-square" /><span>{{ $t('common.edit') }}</span>
            </button>
            <button v-if="has('delete')" type="button" class="sr-btn del" :aria-label="$t('common.delete')" @click.stop="$emit('delete')">
                <svg-icon name="heroicons-outline/trash" /><span>{{ $t('common.delete') }}</span>
            </button>
        </div>
    </div>
</template>

<script lang="ts" src="./swipe-row.ts"></script>
<style lang="scss" src="./swipe-row.scss"></style>
