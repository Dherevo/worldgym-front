<template>
    <AppPage name="profile-page" layout="backoffice">
        <div class="profile-page">
            <div class="card photo-card">
                <UserAvatar :url="photoUrl" :name="nickname" :size="72" />
                <div class="photo-info">
                    <strong>{{ $t('profile.photo') }}</strong>
                    <p class="note">{{ $t('profile.photoNote') }}</p>
                    <div class="photo-actions">
                        <label class="option photo-btn">
                            {{ $t('profile.photoChange') }}
                            <input type="file" accept="image/png,image/jpeg,image/webp" hidden :disabled="uploadingPhoto" @change="uploadPhoto($event)" />
                        </label>
                        <button v-if="photoUrl" type="button" class="option" :disabled="uploadingPhoto" @click="removePhoto()">{{ $t('profile.photoRemove') }}</button>
                    </div>
                </div>
            </div>

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

                <label class="field">
                    <span>{{ $t('profile.birthDate') }}</span>
                    <input type="date" v-model="birthDate" :max="today" />
                </label>
                <p class="note">{{ $t('profile.birthDateNote') }}</p>

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

            <div class="card equipment-card">
                <h2>{{ $t('recommendation.homeEquipment.title') }}</h2>
                <p class="sub">{{ $t('recommendation.homeEquipment.text') }}</p>
                <div class="equipment-list">
                    <label v-for="eq in equipments" :key="eq.id" class="equipment-item">
                        <input type="checkbox" :checked="homeIds.includes(eq.id)" @change="toggleHome(eq.id)" />
                        {{ eq.name }}
                    </label>
                </div>
                <button type="button" class="submit" :disabled="savingEquipment" @click="saveEquipment()">
                    {{ $t('recommendation.homeEquipment.save') }}
                </button>
            </div>

            <div class="card habits-card">
                <h2>{{ $t('habits.card.profileTitle') }}</h2>
                <p class="sub">{{ $t('habits.card.profileText') }}</p>
                <button type="button" class="submit" @click="to('/habits')">{{ $t('habits.card.profileBtn') }}</button>
            </div>

            <EnergyCard />

            <AccountSettings />

            <MeasurementsPage />
        </div>
    </AppPage>
</template>

<script lang="ts" src="./profile.ts"></script>
<style lang="scss" src="./profile.scss"></style>
