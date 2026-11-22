<template>
    <section class="card push-settings" v-if="settings">
        <h2>{{ $t('push.title') }}</h2>
        <p class="sub">{{ $t('push.sub') }}</p>

        <p class="warn" v-if="!settings.available">{{ $t('push.unavailable') }}</p>
        <p class="warn" v-else-if="!settings.devices">{{ $t('push.noDevices') }}</p>

        <div class="ps-row master">
            <span class="ps-label">{{ $t('push.enabled') }}</span>
            <ion-toggle class="ps-toggle" mode="md" :checked="settings.enabled" @ionChange="onToggle('enabled', $event)" />
        </div>

        <template v-if="settings.enabled">
            <div class="ps-row" v-for="t in visibleTypes" :key="t">
                <span class="ps-label">{{ $t('push.types.' + t) }}</span>
                <ion-toggle class="ps-toggle" mode="md" :checked="settings[t]" @ionChange="onToggle(t, $event)" />
            </div>

            <div class="quiet">
                <strong>{{ $t('push.quiet') }}</strong>
                <p class="quiet-hint">{{ $t('push.quietHint') }}</p>
                <div class="quiet-inputs">
                    <label class="quiet-time">
                        <small>{{ $t('push.quietFrom') }}</small>
                        <input type="time" :value="settings.quiet_from" @change="setQuiet('quiet_from', $event)" />
                    </label>
                    <span class="quiet-sep">→</span>
                    <label class="quiet-time">
                        <small>{{ $t('push.quietTo') }}</small>
                        <input type="time" :value="settings.quiet_to" @change="setQuiet('quiet_to', $event)" />
                    </label>
                </div>
            </div>

            <button type="button" class="submit" :disabled="testing || !settings.available" @click="sendTest()">{{ $t('push.test') }}</button>
        </template>

        <button type="button" class="link" @click="to('/weekly-summary')">{{ $t('push.summary') }}</button>
    </section>
</template>

<script lang="ts" src="./push-settings.ts"></script>
<style lang="scss" src="./push-settings.scss"></style>
