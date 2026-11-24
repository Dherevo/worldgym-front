<template>
    <AppPage name="progress-page" layout="backoffice">
        <div class="tabbed-page">
            <TabBar :tabs="tabs" />
            <SwipePager class="tab-content" :index="tabIndex" :count="tabs.length" :enabled="isApp" @change="onPager">
                <template #default="{ index }">
                    <component :is="panels[index]" />
                </template>
            </SwipePager>
        </div>
    </AppPage>
</template>

<script lang="ts" src="./progress.ts"></script>
