<template>
    <BackofficeLayout :menu="[]"
    :topBarHeight="60"
    :menuWidth="0"
    :menuWidthCollapsed="0">

        <template #logo>
            <button class="burger-btn" :aria-expanded="menuOpen" aria-controls="sidebar"
                :aria-label="$t('layout.menu.menu')" @click="menuOpen = !menuOpen">
                <svg-icon :name="menuOpen ? 'radix/cross-1' : 'radix/hamburger-menu'"/>
            </button>
            <span class="app-logo">WORLD<span class="logo-accent">GYM</span></span>
        </template>

        <template #top>
            <div class="flex-grow"></div>

            <!-- Side menu: slides in over the page on every screen size -->
            <div v-if="menuOpen" class="sidebar-backdrop" @click="menuOpen = false"></div>

            <aside id="sidebar" class="sidebar" :class="{ open: menuOpen }">
                <div class="sidebar-logo">
                    <span class="app-logo">WORLD<span class="logo-accent">GYM</span></span>
                </div>

                <div class="sidebar-user" v-if="user" @click="to('/profile')" :title="$t('layout.profile')">
                    <div class="user-avatar" aria-hidden="true">{{ initial }}</div>
                    <div class="user-identity">
                        <div class="user-name">{{ user.nickname || user.name }}</div>
                    </div>
                </div>

                <nav class="sidebar-nav" :aria-label="$t('layout.menu.menu')">
                    <a v-for="item in menuItems" :key="item.path" class="nav-item"
                        :href="item.path" :class="{ active: isActive(item) }" @click.prevent="to(item.path)">
                        <svg-icon :name="item.icon"/>
                        <span>{{ $t(item.label) }}</span>
                    </a>
                    <a class="nav-item" href="/profile" :class="{ active: isActive({ path: '/profile', match: ['/profile', '/measurements', '/habits'] }) }"
                        @click.prevent="to('/profile')">
                        <svg-icon name="prime/user"/>
                        <span>{{ $t('layout.profile') }}</span>
                    </a>
                </nav>

                <div class="sidebar-footer">
                    <div class="language-switcher">
                        <button v-for="lang in languages" :key="lang.code" type="button" class="language-option"
                            :class="{ active: currentLanguage === lang.code }" @click="setLanguage(lang.code)">{{ lang.label }}</button>
                    </div>
                    <button class="footer-btn" @click="toggleTheme()">
                        <svg-icon :name="isDark ? 'prime/sun' : 'prime/moon'"/>
                        <span>{{ isDark ? $t('layout.lightMode') : $t('layout.darkMode') }}</span>
                    </button>
                    <button class="footer-btn" @click="logout()">
                        <svg-icon name="radix/exit"/>
                        <span>{{ $t('layout.logout') }}</span>
                    </button>
                </div>
            </aside>
        </template>

        <slot/>

    </BackofficeLayout>
</template>

<script lang="ts" src="./backoffice.ts"></script>
<style lang="scss" src="./backoffice.scss"></style>
