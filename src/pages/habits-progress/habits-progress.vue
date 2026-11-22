<template>
    <div class="habits-progress">
        <div class="hp-top">
            <div>
                <h1>{{ $t('habits.progress.title') }}</h1>
                <p class="sub">{{ $t('habits.progress.sub') }}</p>
            </div>
            <button type="button" class="hp-config" @click="to('/habits')">
                <svg-icon name="heroicons-outline/cog-6-tooth" />
                <span>{{ $t('habits.progress.configure') }}</span>
            </button>
        </div>
        <HabitsStreak />
    </div>
</template>

<script lang="ts" src="./habits-progress.ts"></script>
<style lang="scss" src="./habits-progress.scss"></style>
