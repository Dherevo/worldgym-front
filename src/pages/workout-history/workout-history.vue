<template>
    <AppPage name="workout-history-page" layout="backoffice">
        <div class="workout-history">
            <div class="wh-top">
                <BackButton class="btn-back" @click="goBack()" />
            </div>
            <WorkoutsPage />
        </div>
    </AppPage>
</template>

<script lang="ts" src="./workout-history.ts"></script>
<style lang="scss" src="./workout-history.scss"></style>
