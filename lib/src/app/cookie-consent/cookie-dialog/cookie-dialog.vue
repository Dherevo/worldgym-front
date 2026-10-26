<template>
    <div id="cookie-consent-dialog">
        <div class="flex-row">
            <h2 class="flex-grow" v-html="$t('cookies.configure')"/>
        </div>

        <p v-html="$t('cookies.dialog')"/>
        <br>

        <p v-html="$t('cookies.required')" />
        <br><br>

        <div v-for="type of types" :key="type.id" class="cookie-type">
            <ToggleSwitch v-model="type.accepted" v-if="!type.required"/>
            <div><b v-safe-html="type.name"/>: <span v-safe-html="type.description"/></div>
        </div>

        <div class="flex-row gap10 buttons">
            <div class="flex-grow"/>

            <btn @click="reject()">{{ $t('cookies.all.reject') }}</btn>
            <btn @click="accept()">{{ $t('cookies.all.selection') }}</btn>
            <btn @click="all()">{{ $t('cookies.all.accept') }}</btn>
        </div>
    </div>
</template>

<script lang="ts" src="./cookie-dialog.ts"></script>
<style lang="scss" src="./cookie-dialog.scss"></style>