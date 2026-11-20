<template>
    <section class="card app-preferences">
        <h2>{{ $t('layout.preferences') }}</h2>

        <div class="language-switcher">
            <button v-for="lang in languages" :key="lang.code" type="button" class="language-option"
                :class="{ active: language === lang.code }" @click="setLanguage(lang.code)">{{ lang.label }}</button>
        </div>

        <button type="button" class="pref-btn" @click="toggleTheme()">
            <svg-icon :name="isDark ? 'prime/sun' : 'prime/moon'"/>
            <span>{{ isDark ? $t('layout.lightMode') : $t('layout.darkMode') }}</span>
        </button>

        <button type="button" class="pref-btn logout" @click="logout()">
            <svg-icon name="radix/exit"/>
            <span>{{ $t('layout.logout') }}</span>
        </button>
    </section>
</template>

<script lang="ts" src="./app-preferences.ts"></script>
<style lang="scss" src="./app-preferences.scss"></style>
