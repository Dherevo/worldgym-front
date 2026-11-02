<template>
    <div class="account-settings">

        <!-- Name and username -->
        <form class="card" @submit.prevent="saveDetails()">
            <h2>{{ $t('account.title') }}</h2>
            <h3>{{ $t('account.details.title') }}</h3>

            <label class="field">
                <span>{{ $t('account.details.name') }}</span>
                <input type="text" v-model="name" maxlength="100" autocomplete="name" required />
            </label>
            <label class="field">
                <span>{{ $t('account.details.nickname') }}</span>
                <input type="text" v-model="nickname" minlength="3" maxlength="30" autocomplete="username" required />
            </label>
            <p class="note">{{ $t('account.details.nicknameHint') }}</p>

            <p class="msg error" v-if="detailsError">{{ detailsError }}</p>
            <p class="msg ok" v-if="detailsOk">{{ $t('account.details.saved') }}</p>
            <button type="submit" class="submit" :disabled="savingDetails || !name || !nickname">{{ $t('account.details.save') }}</button>
        </form>

        <!-- E-mail -->
        <form class="card" @submit.prevent="saveEmail()">
            <h3>{{ $t('account.email.title') }}</h3>

            <div class="current-email">
                <div>
                    <div class="label">{{ $t('account.email.current') }}</div>
                    <div class="value">{{ user?.email }}</div>
                </div>
                <span class="badge" :class="user?.email_verified ? 'ok' : 'warn'">
                    {{ user?.email_verified ? $t('account.email.verified') : $t('account.email.unverified') }}
                </span>
            </div>

            <div class="pending" v-if="user?.pending_email">
                {{ $t('account.email.pending', { email: user.pending_email }) }}
            </div>
            <button type="button" class="link" v-if="!user?.email_verified || user?.pending_email" :disabled="resending" @click="resend()">
                {{ $t('account.email.resend') }}
            </button>

            <label class="field">
                <span>{{ $t('account.email.newEmail') }}</span>
                <input type="email" v-model="newEmail" autocomplete="email" required />
            </label>
            <label class="field">
                <span>{{ $t('account.email.password') }}</span>
                <input type="password" v-model="emailPassword" autocomplete="current-password" required />
            </label>

            <p class="msg error" v-if="emailError">{{ emailError }}</p>
            <p class="msg ok" v-if="emailOk">{{ emailOk }}</p>
            <button type="submit" class="submit" :disabled="savingEmail || !newEmail || !emailPassword">{{ $t('account.email.change') }}</button>
        </form>

        <!-- Password -->
        <form class="card" @submit.prevent="savePassword()">
            <h3>{{ $t('account.password.title') }}</h3>

            <label class="field">
                <span>{{ $t('account.password.current') }}</span>
                <input type="password" v-model="currentPassword" autocomplete="current-password" required />
            </label>
            <label class="field">
                <span>{{ $t('account.password.new') }}</span>
                <input type="password" v-model="newPassword" autocomplete="new-password" minlength="8" required />
            </label>
            <label class="field">
                <span>{{ $t('account.password.repeat') }}</span>
                <input type="password" v-model="repeatPassword" autocomplete="new-password" minlength="8" required />
            </label>

            <p class="msg error" v-if="passwordError">{{ passwordError }}</p>
            <p class="msg ok" v-if="passwordOk">{{ $t('account.password.saved') }}</p>
            <button type="submit" class="submit" :disabled="savingPassword || !currentPassword || !newPassword || !repeatPassword">{{ $t('account.password.save') }}</button>
        </form>
    </div>
</template>

<script lang="ts" src="./account-settings.ts"></script>
<style lang="scss" src="./account-settings.scss"></style>
