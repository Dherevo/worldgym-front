<template>
    <div class="login-page-v1">

        <div class="left" :style="{
            'background-image': image ? `url('${image}')` : ''
        }">
            <slot name="left" />
        </div>

        <div class="right flex-col-center-center">
            
            <div style="width: 100%">
            
                <slot name="top"/>
                <div v-if="!hasSlot('top')" class="text-center">
                    <div style="margin-bottom: 50px" v-if="logo">
                        <img id="logo" :src="logo" />
                    </div>
                    <template v-else>
                        <h1 v-html="$t('login.title')"/>
                        <p class="subtitle" v-html="$t('login.subtitle')"/>
                    </template>
                </div>

                <slot name="form" />
                <template v-if="!hasSlot('form')">

                    <form-input :floatLabel="$t('generic.' + (acceptsUsername ? 'email_username' : 'email') )" 
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
                    :floatLabel="$t('generic.password')" 
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
                    fill
                    @click="submit()"
                    :loading="loading">
                        {{$t('login.submit')}}
                    </btn>
                </template>

                <div class="footer">
                    <p class="register" v-if="canRegister">{{ $t('login.no_have_account') }} <Link href="/register">{{ $t('login.signup') }}</Link></p>
                    <Link class="reset-password" v-if="canResetPassword" href="/reset-password">{{ $t('login.forgot_password') }}</Link>
                    <slot name="footer" />
                </div>

                <slot name="bottom"/>
                <div v-if="!hasSlot('bottom')" style="height: 100px" />
            </div>
        </div>
    </div>
</template>

<script lang="ts" src="./login-page-v1.ts"></script>
<style lang="scss" src="./login-page-v1.scss"></style>