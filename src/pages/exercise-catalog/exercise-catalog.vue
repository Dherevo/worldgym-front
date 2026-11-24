<template>
    <AppPage name="exercise-catalog-page" layout="backoffice">
        <div class="stats-page">
            <div class="sub-top">
                <BackButton class="btn-back" @click="goBack()" />
            </div>
            <ExercisesPage />
        </div>
    </AppPage>
</template>

<script lang="ts" src="./exercise-catalog.ts"></script>
<style lang="scss" src="../stats/stats.scss"></style>
