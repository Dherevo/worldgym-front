<template>
    <AppPage name="profile-page" layout="backoffice">
        <div class="profile-page">
            <form class="card" @submit.prevent="save()">
                <h1>{{ $t('profile.title') }}</h1>
                <p class="sub">{{ $t('profile.sub') }}</p>

                <div class="row">
                    <label class="field">
                        <span>{{ $t('profile.height') }}</span>
                        <input type="number" inputmode="numeric" min="100" max="250" step="1" v-model="height" required />
                    </label>
                    <label class="field">
                        <span>{{ $t('profile.weight') }}</span>
                        <input type="number" inputmode="decimal" min="30" max="300" step="0.1" v-model="weight" required />
                    </label>
                </div>
                <p class="note">{{ $t('profile.weightNote') }}</p>

                <div class="field">
                    <span>{{ $t('profile.gender') }}</span>
                    <div class="options">
                        <button v-for="g in genders" :key="g" type="button" class="option"
                            :class="{ selected: gender === g }" @click="gender = g">
                            {{ $t('profile.' + g) }}
                        </button>
                    </div>
                </div>

                <button type="submit" class="submit" :disabled="saving || !valid">
                    {{ saving ? $t('profile.saving') : $t('profile.save') }}
                </button>
            </form>
        </div>
    </AppPage>
</template>

<script lang="ts" src="./profile.ts"></script>
<style lang="scss" src="./profile.scss"></style>
