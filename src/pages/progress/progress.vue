<template>
    <AppPage name="progress-page" layout="backoffice">
        <div class="tabbed-page">
            <TabBar :tabs="tabs" />
            <div class="tab-content">
                <WorkoutsPage v-if="tab === 'workouts'" />
                <StatsPage v-else-if="tab === 'stats'" />
                <MeasurementsPage v-else />
            </div>
        </div>
    </AppPage>
</template>

<script lang="ts" src="./progress.ts"></script>
