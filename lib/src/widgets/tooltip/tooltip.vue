<template>
    <div class="tooltip">
        <div class="tooltip-content" ref="tooltip">
            <div>
                <slot />
            </div>
        </div>
    </div>
</template>

<script lang="ts" src="./tooltip.ts"></script>

<style lang="scss">
.tooltip {
    width: fit-content;
}
</style>