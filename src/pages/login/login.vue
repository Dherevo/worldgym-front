<template>
    <AppPage>
        <Login id="login-page"  image="/images/login.jpg"
        logo="/images/logo.svg"
        @submit="doLogin($event)" />
    </AppPage>
</template>

<script lang="ts" src="./login.ts"></script>
<style lang="scss" src="./login.scss"></style>
