<template>
    <div id="cookie-consent-banner" v-if="enabled && !cookiesAnswered">

        <h3 v-html="$t('cookies.title')" />

        <p v-html="$t('cookies.text')"/>

        <div class="flex-row gap10 bottom">
            <div class="flex-grow" />

            <btn class="plain" v-if="types.length > 0"
            @click="configure()">{{ $t('cookies.configure') }}</btn>
            <btn class="plain" @click="reject()">{{ $t('cookies.reject') }}</btn>
            <btn @click="accept()">{{ $t('cookies.accept') }}</btn>
        </div>

    </div>
</template>

<script lang="ts" src="./cookie-consent.ts"></script>
<style lang="scss" src="./cookie-consent.scss"></style>