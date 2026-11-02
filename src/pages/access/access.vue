<template>
    <AppPage name="access-page" layout="plain">
        <div id="login-page">
            <div class="glow glow-red"></div>
            <div class="glow glow-blue"></div>
            <div class="grid-bg"></div>

            <!-- Forgot password -->
            <form v-if="mode === 'forgot'" class="card" @submit.prevent="sendLink()">
                <span class="brand-name">WorldGym</span>
                <h2>{{ $t('access.forgot.title') }}</h2>
                <p class="card-sub" v-if="!done">{{ $t('access.forgot.sub') }}</p>

                <template v-if="!done">
                    <label class="field">
                        <span>{{ $t('access.forgot.email') }}</span>
                        <input type="email" v-model="email" autocomplete="email" autofocus required />
                    </label>
                    <button type="submit" class="submit" :disabled="loading || !email">
                        {{ loading ? $t('access.forgot.sending') : $t('access.forgot.send') }}
                    </button>
                </template>
                <p class="card-sub" v-else>{{ $t('access.forgot.sent') }}</p>

                <a class="forgot-link" href="/login" @click.prevent="to('/login')">{{ $t('access.back') }}</a>
            </form>

            <!-- Choose a new password -->
            <form v-else-if="mode === 'reset'" class="card" @submit.prevent="savePassword()">
                <span class="brand-name">WorldGym</span>
                <h2>{{ $t('access.reset.title') }}</h2>

                <template v-if="!done">
                    <p class="card-sub">{{ $t('access.reset.sub') }}</p>
                    <label class="field">
                        <span>{{ $t('access.reset.password') }}</span>
                        <input type="password" v-model="password" autocomplete="new-password" minlength="8" required />
                    </label>
                    <label class="field">
                        <span>{{ $t('access.reset.repeat') }}</span>
                        <input type="password" v-model="repeat" autocomplete="new-password" minlength="8" required />
                    </label>
                    <div class="error" v-if="error">{{ error }}</div>
                    <button type="submit" class="submit" :disabled="loading || !password || !repeat">
                        {{ loading ? $t('access.reset.saving') : $t('access.reset.save') }}
                    </button>
                    <a class="forgot-link" v-if="error" href="/forgot-password" @click.prevent="to('/forgot-password')">{{ $t('access.reset.again') }}</a>
                </template>
                <template v-else>
                    <p class="card-sub">{{ $t('access.reset.done') }}</p>
                    <button type="button" class="submit" @click="to('/login')">{{ $t('access.reset.login') }}</button>
                </template>
            </form>

            <!-- Confirm an e-mail -->
            <div v-else class="card">
                <span class="brand-name">WorldGym</span>
                <h2>{{ $t('access.verify.title') }}</h2>
                <p class="card-sub" v-if="loading">{{ $t('access.verify.working') }}</p>
                <p class="card-sub" v-else-if="done">{{ $t('access.verify.ok') }}</p>
                <div class="error" v-else-if="error">{{ error }}</div>
                <button type="button" class="submit" v-if="!loading" @click="to(loggedIn ? '/' : '/login')">{{ $t('access.verify.open') }}</button>
            </div>
        </div>
    </AppPage>
</template>

<script lang="ts" src="./access.ts"></script>
