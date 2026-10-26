<template>
    <AppGlobalWidgets ref="globalWidgets"/>
    <component :is="getLayout()" v-bind="{page: () => this}">
        <template v-if="loading">
            <component :is="loadscreenComponent" v-if="loadscreenComponent" />
            <loader v-else/>
        </template>
        <template v-else>
            <slot v-bind="{page: () => this}"/>
        </template>
    </component>
</template>

<script lang="ts" src="./app-page.ts"></script>