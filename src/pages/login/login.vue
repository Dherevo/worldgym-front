<template>
    <AppPage>
        <div id="login-page">
            <div class="glow glow-red"></div>
            <div class="glow glow-blue"></div>
            <div class="grid-bg"></div>

            <div class="hero">
                <div class="brand">
                    <span class="brand-mark">W</span>
                    <span class="brand-name">WorldGym</span>
                </div>
                <h1>{{ $t('login.heroTitle') }}</h1>
                <p class="hero-sub">{{ $t('login.heroSub') }}</p>
                <ul class="hero-points">
                    <li><span class="dot"></span>{{ $t('login.point1') }}</li>
                    <li><span class="dot"></span>{{ $t('login.point2') }}</li>
                    <li><span class="dot"></span>{{ $t('login.point3') }}</li>
                </ul>
            </div>

            <form class="card" @submit.prevent="submit()">
                <div class="card-brand">
                    <span class="brand-mark">W</span>
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
