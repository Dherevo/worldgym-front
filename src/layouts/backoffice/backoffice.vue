<template>
    <BackofficeLayout :menu="[]"
    :topBarHeight="60"
    :menuWidth="0"
    :menuWidthCollapsed="0">

        <template #logo>
            <span class="app-logo">WORLD<span class="logo-accent">GYM</span></span>
            <nav class="top-nav" :aria-label="$t('layout.menu.menu')">
                <a v-for="item in menuItems" :key="item.path" class="top-nav-item"
                    :href="item.path" :class="{ active: isActive(item.path) }" @click.prevent="to(item.path)">
                    <svg-icon :name="item.icon"/> {{ $t(item.label) }}
                </a>
            </nav>
        </template>

        <template #top>
            <div class="flex-grow"></div>
            <div class="language-switcher flex-row gap5">
                <span v-for="lang in languages" :key="lang.code"
                    class="language-option" :class="{ active: currentLanguage === lang.code }"
                    @click="setLanguage(lang.code)">{{ lang.label }}</span>
            </div>
            <div class="user flex-row gap10">
                <div class="user-identity">
                    <div>{{ user?.name }}</div>
                    <div style="font-size:.8rem">{{ user?.email }}</div>
                </div>
                <div class="user-menu">
                    <div class="theme-toggle" @click="toggleTheme()" :title="isDark ? $t('layout.lightMode') : $t('layout.darkMode')">
                        <svg-icon v-if="isDark" name="prime/sun"/>
                        <svg-icon v-else name="prime/moon"/>
                    </div>
                    <div id="logout" class="flex-row gap5" @click="logout()">
                        <svg-icon name="radix/exit"/>
                        {{ $t('layout.logout') }}
                    </div>
                </div>
            </div>
            <button class="mobile-menu-btn" :aria-expanded="menuOpen" aria-controls="mobile-menu"
                :aria-label="$t('layout.menu.menu')" @click="menuOpen = !menuOpen">
                <svg-icon :name="menuOpen ? 'radix/cross-1' : 'radix/hamburger-menu'"/>
            </button>
            <template v-if="menuOpen">
                <div class="mobile-menu-backdrop" @click="menuOpen = false"></div>
                <nav id="mobile-menu" class="mobile-menu" :aria-label="$t('layout.menu.menu')">
                    <a v-for="item in menuItems" :key="item.path" class="mm-item"
                        :href="item.path" :class="{ active: isActive(item.path) }" @click.prevent="to(item.path)">
                        <svg-icon :name="item.icon"/> {{ $t(item.label) }}
                    </a>
                    <div class="mm-user" v-if="user">
                        <div>{{ user.name }}</div>
                        <div class="mm-user-email">{{ user.email }}</div>
                    </div>
                    <div class="mm-langs">
                        <button v-for="lang in languages" :key="lang.code" class="mm-lang"
                            :class="{ active: currentLanguage === lang.code }" @click="setLanguage(lang.code)">{{ lang.label }}</button>
                    </div>
                    <button class="mm-item" @click="toggleTheme()">
                        <svg-icon :name="isDark ? 'prime/sun' : 'prime/moon'"/> {{ isDark ? $t('layout.lightMode') : $t('layout.darkMode') }}
                    </button>
                    <button class="mm-item mm-logout" @click="logout()">
                        <svg-icon name="radix/exit"/> {{ $t('layout.logout') }}
                    </button>
                </nav>
            </template>
        </template>

        <slot/>

    </BackofficeLayout>
</template>

<script lang="ts" src="./backoffice.ts"></script>
<style lang="scss" src="./backoffice.scss"></style>
