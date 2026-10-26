<template>
    <div class="login-page-v2">

        <div class="left"></div>

        <div class="right">
            <div class="copyright">
                v{{ getVersion() }}. Copyright © {{ currentYear() }}. All rights reserved.
            </div>
        </div>

        <div class="login-box-container">
            <div class="login-box">
                <slot name="form" />
                <template v-if="!hasSlot('form')">

                    <img class="logo" :src="logo" />

                    <div class="warning" v-if="warning" v-safe-html="warning"/>

                    <form-input :label="$t('generic.' + (acceptsUsername ? 'email_username' : 'email') )" 
                    :type="acceptsUsername ? 'text' : 'email'"
                    :invalid="error == 'username'"
                    @change="error = ''; errorMessage = ''" 
                    v-model="username"
                    @pressEnter="focusPassword()"
                    :pass="{
                        autocomplete: 'off',
                        name: 'username_' + disableAutocompleteDynamicValue
                    }"/>

                    <div class="error-message" v-if="error == 'username' && errorMessage">
                        <div>{{ errorMessage }}</div><br>
                    </div>

                    <form-input 
                    ref="passwordInput"
                    :label="$t('generic.password')" 
                    type="password" 
                    :error="error == 'password'"
                    v-model="password"
                    @pressEnter="submit"
                    :pass="{
                        autocomplete: 'off',
                        name: 'password_' + disableAutocompleteDynamicValue
                    }"/>

                    <div class="error-message" v-if="error == 'password' && errorMessage">
                        {{ errorMessage }}
                    </div>

                    <template v-if="errorMessage && !['username', 'password'].includes(error)">
                        <br><br>
                        <div class="error-message text-center">{{ errorMessage }}</div>
                    </template>

                    <btn
                    class="submit"
                    fill
                    @click="submit()"
                    :loading="loading">
                        {{$t('login.submit')}}
                    </btn>

                    <div class="footer">
                        <p class="register" 
                        v-if="canRegister">
                            {{ $t('login.no_have_account') }}
                            <Link href="/register">{{ $t('login.signup') }}</Link>
                        </p>

                        <Link v-if="canResetPassword" 
                        class="reset-password"
                        href="/reset-password">
                            {{ $t('login.forgot_password') }}
                        </Link>
                        
                        <slot name="footer" />
                    </div>

                </template>
            </div>
        </div>
    </div>
</template>

<script lang="ts" src="./login-page-v2.ts"></script>
<style lang="scss" src="./login-page-v2.scss"></style>