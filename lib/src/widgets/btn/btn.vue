<template>
    
    <Link v-if="link" :href="link" :target="target" class="btn-link">
        <button class="btn" v-ripple ref="root" 
        :style="btnStyle()"
        :class="{
            disabled: isDisabled(),
            'no-fill': fill !== true,
            centered: center,
            rounded: rounded,
            'p-ripple': ripple,
            'no-ripple': !ripple,
            nude: nude
        }">
            <div v-if="!isLoading()" class="flex-row btn-content">
                <div v-if="content" v-safe-html="content" />
                <slot />
            </div>

            <loader v-if="isLoading()" :size="18" color="white" backcolor="var(--primary-color)"/>
        </button>
    </Link>

    <button v-else class="btn" v-ripple ref="root" 
        :style="btnStyle()"
        :class="{
            disabled: isDisabled(),
            'no-fill': fill !== true,
            centered: center,
            rounded: rounded,
            'p-ripple': ripple,
            'no-ripple': !ripple,
            nude: nude
        }" @click="clickAction($event)">
            <div v-if="!isLoading()" class="flex-row btn-content">
                <div v-if="content" v-safe-html="content" />
                <slot />
            </div>

            <loader v-if="isLoading()" :size="18" color="white" backcolor="var(--primary-color)"/>
        </button>

</template>

<style lang="scss" src="./btn.scss"></style>
<script lang="ts" src="./btn.ts"></script>