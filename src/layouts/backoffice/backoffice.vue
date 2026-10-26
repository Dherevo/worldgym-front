<template>
    <BackofficeLayout :menu="[]"
    :topBarHeight="60"
    :menuWidth="0"
    :menuWidthCollapsed="0">

        <template #logo>
            <span class="app-logo">WORLD<span class="logo-accent">GYM</span></span>
            <nav class="top-nav">
                <a class="top-nav-item" :class="{ active: isActive('/') }" @click="to('/')">
                    <svg-icon name="prime/home"/> Dashboard
                </a>
                <a class="top-nav-item" :class="{ active: isActive('/exercises') }" @click="to('/exercises')">
                    <svg-icon name="prime/bolt"/> Exercicis
                </a>
                <a class="top-nav-item" :class="{ active: isActive('/routines') }" @click="to('/routines')">
                    <svg-icon name="prime/calendar"/> Rutines
                </a>
                <a class="top-nav-item" :class="{ active: isActive('/workouts') }" @click="to('/workouts')">
                    <svg-icon name="prime/history"/> Historial
                </a>
                <a class="top-nav-item" :class="{ active: isActive('/stats') }" @click="to('/stats')">
                    <svg-icon name="prime/chart-bar"/> Estadístiques
                </a>
            </nav>
        </template>

        <template #top>
            <div class="flex-grow"></div>
            <div class="user flex-row gap10">
                <div>
                    <div>{{ user?.name }}</div>
                    <div style="font-size:.8rem">{{ user?.email }}</div>
                </div>
                <div class="user-menu">
                    <div class="theme-toggle" @click="toggleTheme()" :title="isDark ? 'Mode clar' : 'Mode fosc'">
                        <svg-icon v-if="isDark" name="prime/sun"/>
                        <svg-icon v-else name="prime/moon"/>
                    </div>
                    <div id="logout" class="flex-row gap5" @click="logout()">
                        <svg-icon name="radix/exit"/>
                        Sortir
                    </div>
                </div>
            </div>
        </template>

        <slot/>

    </BackofficeLayout>
</template>

<script lang="ts" src="./backoffice.ts"></script>
<style lang="scss" src="./backoffice.scss"></style>
