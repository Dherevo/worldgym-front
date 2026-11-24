<template>
    <div ref="root" class="swipe-pager" :class="{ enabled }" :style="fill ? { minHeight: fill + 'px' } : undefined">
        <div ref="track" class="sp-track" :class="{ animating }" :style="trackStyle" @transitionend="onTransitionEnd">
            <div v-for="i in shown" :key="i" class="sp-panel" :class="{ side: i !== cur }"
                :style="i !== cur ? { left: (i - cur) * 100 + '%' } : undefined">
                <slot :index="i" />
            </div>
        </div>
    </div>
</template>

<script lang="ts" src="./swipe-pager.ts"></script>
<style lang="scss" src="./swipe-pager.scss"></style>
