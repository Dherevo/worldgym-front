<template>
    <AppPage name="onboarding-page" layout="default">
        <div class="onboarding-page">
            <form v-if="ready" class="card" @submit.prevent="submit()">
                <h1>{{ $t('onboarding.title') }}</h1>
                <p class="sub">{{ $t('onboarding.sub') }}</p>

                <div class="row">
                    <label class="field">
                        <span>{{ $t('onboarding.height') }}</span>
                        <input type="number" inputmode="numeric" min="100" max="250" step="1"
                            v-model="height" :title="$t('onboarding.heightRange')" required />
                    </label>
                    <label class="field">
                        <span>{{ $t('onboarding.weight') }}</span>
                        <input type="number" inputmode="decimal" min="30" max="300" step="0.1"
                            v-model="weight" :title="$t('onboarding.weightRange')" required />
                    </label>
                </div>

                <div class="field">
                    <span>{{ $t('onboarding.gender') }}</span>
                    <div class="options">
                        <button v-for="g in genders" :key="g" type="button" class="option"
                            :class="{ selected: gender === g }" @click="gender = g">
                            {{ $t('onboarding.' + g) }}
                        </button>
                    </div>
                </div>

                <div class="error" v-if="error">{{ error }}</div>

                <button type="submit" class="submit" :disabled="saving || !valid">
                    {{ saving ? $t('onboarding.saving') : $t('onboarding.save') }}
                </button>
            </form>
        </div>
    </AppPage>
</template>

<script lang="ts" src="./onboarding.ts"></script>
<style lang="scss" src="./onboarding.scss"></style>
