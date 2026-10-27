<template>
    <AppPage>
        <div id="login-page">
            <div class="glow glow-red"></div>
            <div class="glow glow-blue"></div>
            <div class="grid-bg"></div>

            <form class="card" @submit.prevent="submit()">
                <div class="card-brand">
                    <svg class="globe" viewBox="0 0 96 64" aria-hidden="true">
                        <circle cx="48" cy="32" r="27" fill="#fff" stroke="#000" stroke-width="3"/>
                        <ellipse cx="48" cy="32" rx="11" ry="27" fill="none" stroke="#000" stroke-width="2.2"/>
                        <path d="M48 5v54M21 32h54M26 18h44M26 46h44" fill="none" stroke="#000" stroke-width="2.2"/>
                        <g fill="#000" stroke="#fff" stroke-width="2.5" stroke-linejoin="round">
                            <rect x="2" y="20" width="9" height="24" rx="3"/>
                            <rect x="11" y="14" width="9" height="36" rx="3"/>
                            <rect x="76" y="14" width="9" height="36" rx="3"/>
                            <rect x="85" y="20" width="9" height="24" rx="3"/>
                            <rect x="20" y="30" width="56" height="4" rx="1.5"/>
                        </g>
                    </svg>
                    <span class="brand-name">WorldGym</span>
                </div>
                <h2>{{ $t('login.welcome') }}</h2>
                <p class="card-sub">{{ $t('login.welcomeSub') }}</p>

                <label class="field">
                    <span>{{ $t('login.username') }}</span>
                    <input type="text" v-model="username" autocomplete="username" autofocus required />
                </label>

                <label class="field">
                    <span>{{ $t('login.password') }}</span>
                    <div class="pass-wrap">
                        <input :type="showPassword ? 'text' : 'password'" v-model="password"
                               autocomplete="current-password" required />
                        <button type="button" class="toggle" @click="showPassword = !showPassword"
                                :aria-label="showPassword ? $t('login.hide') : $t('login.show')">
                            {{ showPassword ? $t('login.hide') : $t('login.show') }}
                        </button>
                    </div>
                </label>

                <div class="error" v-if="error">{{ error }}</div>

                <button type="submit" class="submit" :disabled="loading || !username || !password">
                    {{ loading ? $t('login.signingIn') : $t('login.signIn') }}
                </button>
            </form>
        </div>
    </AppPage>
</template>

<script lang="ts" src="./login.ts"></script>
<style lang="scss" src="./login.scss"></style>
