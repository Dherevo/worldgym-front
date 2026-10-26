<template>
    <svg xmlns="http://www.w3.org/2000/svg" class="icon sprite-icons" :style="iconStyle()">
        <use :href="'/svg-icons/' + lib + '.svg' + cacheLabel() + '#' + iconName" 
        :xlink:href="'/svg-icons/' + lib + '.svg' + cacheLabel() + '#' + iconName"></use>
    </svg>
</template>

<script lang="ts" src="./svg-icon.ts"></script>

<style>
svg.icon {
    width: 20px;
    height: 20px;
}
</style>