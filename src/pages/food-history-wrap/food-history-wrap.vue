<template>
    <AppPage name="food-history-wrap-page" layout="backoffice">
        <div class="stats-page">
            <div class="sub-top">
                <BackButton class="btn-back" @click="goBack()" />
            </div>
            <FoodHistoryPage />
        </div>
    </AppPage>
</template>

<script lang="ts" src="./food-history-wrap.ts"></script>
<style lang="scss" src="../stats/stats.scss"></style>
