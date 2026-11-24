<template>
    <SectionTile v-if="!loading" :inline="!compact" v-model:open="open"
        :title="$t('checkin.title')" :status="statusLabel" :tone="answered ? 'done' : 'pending'">
        <div class="check-in">

            <div class="ci-done" v-if="answered && !editing">
                <div class="ci-done-title"><i class="ci-tick">✓</i>{{ $t('checkin.done') }}</div>
                <div class="ci-stats">
                    <div class="ci-stat" v-for="f in fields" :key="f">
                        <span class="ci-stat-label">{{ $t('checkin.' + f) }}</span>
                        <b class="ci-stat-value">{{ values[f] }}<small>/5</small></b>
                        <span class="ci-dots"><i v-for="n in scale" :key="n" :class="{ on: n <= values[f] }"></i></span>
                    </div>
                </div>
                <button type="button" class="ci-change" @click="editing = true">{{ $t('checkin.change') }}</button>
            </div>

            <div class="ci-form" v-else>
                <h3 v-if="!compact">{{ $t('checkin.title') }}</h3>
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
    </SectionTile>
</template>

<script lang="ts" src="./check-in.ts"></script>
<style lang="scss" src="./check-in.scss"></style>
