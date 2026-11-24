<template>
    <AppPage name="habit-progress-page" layout="backoffice">
        <div class="habit-progress">
            <div class="hpp-top">
                <BackButton class="btn-back" @click="goBack()" />
            </div>
            <HabitsProgressPage />
        </div>
    </AppPage>
</template>

<script lang="ts" src="./habit-progress.ts"></script>
<style lang="scss" src="./habit-progress.scss"></style>
