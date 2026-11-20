<template>
    <section class="card push-settings" v-if="settings">
        <h2>{{ $t('push.title') }}</h2>
        <p class="sub">{{ $t('push.sub') }}</p>

        <p class="warn" v-if="!settings.available">{{ $t('push.unavailable') }}</p>
        <p class="warn" v-else-if="!settings.devices">{{ $t('push.noDevices') }}</p>

        <label class="row master">
            <span>{{ $t('push.enabled') }}</span>
            <input type="checkbox" class="switch" :checked="settings.enabled" @change="toggle('enabled')" />
        </label>

        <template v-if="settings.enabled">
            <label class="row" v-for="t in visibleTypes" :key="t">
                <span>{{ $t('push.types.' + t) }}</span>
                <input type="checkbox" class="switch" :checked="settings[t]" @change="toggle(t)" />
            </label>

            <div class="quiet">
                <strong>{{ $t('push.quiet') }}</strong>
                <div class="quiet-inputs">
                    <label>{{ $t('push.quietFrom') }} <input type="time" :value="settings.quiet_from" @change="setQuiet('quiet_from', $event)" /></label>
                    <label>{{ $t('push.quietTo') }} <input type="time" :value="settings.quiet_to" @change="setQuiet('quiet_to', $event)" /></label>
                </div>
            </div>

            <button type="button" class="submit" :disabled="testing || !settings.available" @click="sendTest()">{{ $t('push.test') }}</button>
        </template>

        <button type="button" class="link" @click="to('/weekly-summary')">{{ $t('push.summary') }}</button>
    </section>
</template>

<script lang="ts" src="./push-settings.ts"></script>
<style lang="scss" src="./push-settings.scss"></style>
