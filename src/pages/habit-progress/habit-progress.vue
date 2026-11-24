<template>
    <AppPage name="habit-progress-page" layout="backoffice">
        <div class="stats-page habit-view">
            <div class="sub-top">
                <BackButton class="btn-back" @click="goBack()" />
                <h1>{{ $t('layout.menu.habits') }}</h1>
            </div>
            <HabitsProgressPage />
        </div>
    </AppPage>
</template>

<script lang="ts" src="./habit-progress.ts"></script>
