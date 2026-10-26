<template>
    <div id="app-global-widgets">
        <drawer ref="appDrawer"/>
        <app-notifications ref="appNotifications"/>
        <app-modal ref="appModal"/>
        <CookieConsent ref="cookieConsent"/>
    </div>
</template>

<script lang="ts" src="./app-global-widgets.ts"></script>
<style lang="scss" src="./app-global-widgets.scss"></style>