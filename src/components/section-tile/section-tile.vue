<template>
    <slot v-if="inline" />
    <div v-else class="section-tile">
        <button type="button" class="st-head" @click="$emit('update:open', true)">
            <span class="st-title">{{ title }}</span>
            <span class="st-status" :class="tone" v-if="status">{{ status }}</span>
            <span class="st-arrow">&rsaquo;</span>
        </button>

        <Teleport to="body">
        <div v-if="open" class="st-overlay" @click.self="$emit('update:open', false)">
            <div class="st-modal">
                <div class="st-modal-head">
                    <h2>{{ title }}</h2>
                    <button type="button" class="st-close" @click="$emit('update:open', false)">✕</button>
                </div>
                <div class="st-body"><slot /></div>
            </div>
        </div>
        </Teleport>
    </div>
</template>

<script lang="ts" src="./section-tile.ts"></script>
<style lang="scss" src="./section-tile.scss"></style>
