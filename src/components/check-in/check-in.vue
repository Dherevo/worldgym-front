<template>
    <div class="check-in" v-if="!loading">

        <div class="ci-done" v-if="answered && !editing">
            <span>✓ {{ $t('checkin.done') }}:
                {{ $t('checkin.energy') }} {{ values.energy }}/5 ·
                {{ $t('checkin.sleep') }} {{ values.sleep }}/5 ·
                {{ $t('checkin.pain') }} {{ values.pain }}/5
            </span>
            <a class="ci-link" href="#" @click.prevent="editing = true">{{ $t('checkin.change') }}</a>
        </div>

        <div class="ci-form" v-else>
            <h3>{{ $t('checkin.title') }}</h3>
            <p class="ci-sub">{{ $t('checkin.sub') }}</p>

            <div class="ci-row" v-for="f in fields" :key="f">
                <div class="ci-label">{{ $t('checkin.' + f) }}</div>
                <div class="ci-scale">
                    <span class="ci-end">{{ $t('checkin.low.' + f) }}</span>
                    <button v-for="n in scale" :key="n" type="button" class="ci-btn"
                        :class="{ selected: values[f] === n }" @click="values[f] = n">{{ n }}</button>
                    <span class="ci-end">{{ $t('checkin.high.' + f) }}</span>
                </div>
            </div>

            <button class="ci-save" :disabled="!complete || saving" @click="save()">
                {{ saving ? $t('checkin.saving') : $t('checkin.save') }}
            </button>
        </div>
    </div>
</template>

<script lang="ts" src="./check-in.ts"></script>
<style lang="scss" src="./check-in.scss"></style>
