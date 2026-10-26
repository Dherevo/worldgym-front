<template>
    <div class="game-detail-popup-overlay" @click.self="$emit('close')">
        <div class="game-detail-popup">

            <button class="popup-close" @click="$emit('close')">×</button>

            <div class="popup-header">
                <img :src="game.icon" :alt="game.name" class="popup-game-icon" />
                <div class="popup-game-meta">
                    <h2 class="popup-game-name">{{ game.name }}</h2>
                    <div class="popup-meta-row">
                        <span class="popup-platform">{{ game.platform?.platform_name }}</span>
                        <span class="popup-status-badge" :class="`status-${displayStatus}`">{{ statusLabel }}</span>
                        <span class="popup-playtime">{{ Math.round(game.playtime / 60) }}h played</span>
                    </div>
                    <div v-if="game.achievements" class="popup-ach-progress">
                        <div class="popup-ach-bar">
                            <div class="popup-ach-fill" :style="{ width: `${achPct}%` }"></div>
                        </div>
                        <span class="popup-ach-count">{{ game.user_achievements }} / {{ game.achievements }} achievements ({{ achPct }}%)</span>
                    </div>
                </div>
            </div>

            <div class="popup-body">
                <div v-if="loading" class="popup-loading">
                    <loader />
                </div>

                <div v-else-if="achievements.length === 0" class="popup-empty">
                    <svg-icon name="radix/trophy" />
                    <span>No achievements available</span>
                </div>

                <div v-else class="popup-ach-list">
                    <div v-for="ach in achievements" :key="ach.id"
                        class="ach-item"
                        :class="{ unlocked: ach.unlocked_at }">
                        <div class="ach-icon-wrap">
                            <img v-if="ach.icon" :src="ach.icon" :alt="ach.name" class="ach-icon" />
                            <div v-else class="ach-icon-placeholder">🏆</div>
                            <div v-if="!ach.unlocked_at" class="ach-lock-overlay">
                                <svg-icon name="radix/lock-closed" />
                            </div>
                        </div>
                        <div class="ach-info">
                            <span class="ach-name">{{ ach.name }}</span>
                            <span class="ach-desc">{{ ach.description }}</span>
                            <span v-if="ach.unlocked_at" class="ach-date">{{ formatDate(ach.unlocked_at) }}</span>
                        </div>
                        <div class="ach-check">
                            <svg-icon v-if="ach.unlocked_at" name="radix/check-circled" />
                        </div>
                    </div>
                </div>
            </div>

            <div class="popup-footer">
                <button class="popup-detail-btn" @click="goToDetail">
                    <svg-icon name="radix/external-link" />
                    View full details
                </button>
            </div>

        </div>
    </div>
</template>

<script lang="ts" src="./game-detail-popup.ts"></script>
<style lang="scss" src="./game-detail-popup.scss"></style>
