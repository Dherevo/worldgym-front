<template>
    <AppPage name="train-page" layout="backoffice">
        <div class="tabbed-page">
            <TabBar :tabs="tabs" />
            <div class="tab-content">
                <RoutinesPage v-if="tab === 'routines'" />
                <ExercisesPage v-else />
            </div>
        </div>
    </AppPage>
</template>

<script lang="ts" src="./train.ts"></script>
