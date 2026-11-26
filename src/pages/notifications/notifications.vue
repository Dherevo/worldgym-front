<template>
    <AppPage name="notifications-page" layout="backoffice">
        <div class="stats-page notifications-view">
            <div class="sub-top">
                <BackButton class="btn-back" @click="goBack()" />
                <h1>{{ $t('notifications.title') }}</h1>
            </div>

            <div class="section-card nt-card">
                <p v-if="loading && !items.length" class="nt-empty">…</p>
                <p v-else-if="!items.length" class="nt-empty">{{ $t('notifications.empty') }}</p>

                <template v-else>
                    <div class="nt-actions">
                        <button type="button" class="nt-link" :disabled="!unread" @click="markAll()">{{ $t('notifications.markAll') }}</button>
                        <button type="button" class="nt-link danger" @click="clear()">{{ $t('notifications.clear') }}</button>
                    </div>

                    <ul class="nt-list">
                        <li v-for="n in items" :key="n.id">
                            <SwipeRow :actions="['delete']" @delete="remove(n)">
                                <div class="nt-row" :class="{ unread: !n.read }" @click="open(n)">
                                    <svg-icon class="nt-icon" :name="icon(n)" />
                                    <div class="nt-main">
                                        <span class="nt-title">{{ text(n, 'title') }}</span>
                                        <span class="nt-body">{{ text(n, 'body') }}</span>
                                        <span class="nt-time">{{ when(n) }}</span>
                                    </div>
                                    <span v-if="!n.read" class="nt-dot"></span>
                                </div>
                            </SwipeRow>
                        </li>
                    </ul>
                </template>
            </div>
        </div>
    </AppPage>
</template>

<script lang="ts" src="./notifications.ts"></script>
<style lang="scss" src="../stats/stats.scss"></style>
<style lang="scss" src="./notifications.scss"></style>
