<template>
    <AppPage name="library-page" layout="backoffice">
        <div id="library-page">

            <transition name="toast">
                <div v-if="errorMsg" class="toast-error">{{ errorMsg }}</div>
            </transition>

            <div class="library-header">
                <div class="search-wrap">
                    <span class="search-icon"><svg-icon name="radix/magnifying-glass"/></span>
                    <input class="search-input" v-model="search" @input="onSearchInput" placeholder="Search games…" />
                    <button v-if="search" class="search-clear" @click="clearSearch">×</button>
                </div>
                <div class="totals">
                    <div v-for="t in totals" :key="t.status"
                        class="total-badge"
                        :class="[`status-${t.status}`, { hidden: hiddenStatuses.has(t.status) }]"
                        @click="toggleStatusFilter(t.status)">
                        <span class="total-count">{{ t.total }}</span>
                        <span class="total-label">{{ statusLabel(t.status) }}</span>
                    </div>
                </div>
                <div class="sort-controls">
                    <button v-for="opt in sortOptions" :key="opt.key"
                        :class="{ active: orderBy === opt.key }"
                        @click="setOrder(opt.key)">
                        {{ opt.label }}
                        <svg-icon v-if="orderBy === opt.key" :name="orderDir === 'asc' ? 'radix/arrow-up' : 'radix/arrow-down'"/>
                    </button>
                </div>
                <div class="view-toggle">
                    <button :class="{ active: viewMode === 'grid-large' }" @click="viewMode = 'grid-large'" title="Grid large">
                        <svg-icon name="radix/grid"/>
                    </button>
                    <button :class="{ active: viewMode === 'grid-small' }" @click="viewMode = 'grid-small'" title="Grid small">
                        <svg-icon name="radix/dashboard"/>
                    </button>
                    <button :class="{ active: viewMode === 'list' }" @click="viewMode = 'list'" title="List">
                        <svg-icon name="radix/rows"/>
                    </button>
                </div>
            </div>

            <div v-if="totals.length" class="status-chart">
                <svg viewBox="0 0 100 100" class="donut-chart">
                    <circle cx="50" cy="50" r="35" fill="none" stroke="#484846" stroke-width="10"/>
                    <circle v-for="seg in chartSegments" :key="seg.status"
                        cx="50" cy="50" r="35"
                        fill="none"
                        :stroke="seg.color"
                        stroke-width="10"
                        :stroke-dasharray="`${seg.len} ${circ}`"
                        :stroke-dashoffset="seg.offset"
                        transform="rotate(-90 50 50)"/>
                    <text x="50" y="46" text-anchor="middle" class="donut-total">{{ totalGames }}</text>
                    <text x="50" y="58" text-anchor="middle" class="donut-sub">games</text>
                </svg>
                <div class="chart-legend">
                    <div v-for="t in totals" :key="t.status" class="legend-item" :class="`status-${t.status}`">
                        <span class="legend-dot"></span>
                        <span class="legend-label">{{ statusLabel(t.status) }}</span>
                        <span class="legend-count">{{ t.total }}</span>
                        <span class="legend-pct">{{ pct(t.total) }}%</span>
                    </div>
                </div>
            </div>

            <div v-if="loading" class="loading-wrap">
                <loader/>
            </div>

            <div v-else-if="games.length === 0" class="empty-state">
                <svg-icon name="radix/magnifying-glass"/>
                <p>No games found</p>
                <span>Try changing the search or filters</span>
            </div>

            <div v-else class="games-grid" :class="viewMode">
                <div v-for="(game, index) in games" :key="game.id"
                    class="game-card"
                    :class="[viewMode === 'list' ? `status-${displayStatus(game)}` : '', `status-${displayStatus(game)}`]"
                    :style="{ animationDelay: `${Math.min(index, 20) * 0.04}s` }"
                    @click="selectedGame = game">
                    <span class="status-dot"></span>
                    <div class="game-icon" :class="`status-${displayStatus(game)}`" :data-id="game.id">
                        <img :src="game.icon" :alt="game.name" loading="lazy" @load="(e) => e.target.classList.add('loaded')" />
                        <div v-if="viewMode !== 'list'" class="game-hover-overlay">
                            <span class="game-hover-name">{{ game.name }}</span>
                        </div>
                        <span v-if="viewMode !== 'list'" class="game-status">
                            {{ statusLabel(displayStatus(game)) }}
                        </span>
                        <div v-if="viewMode !== 'list' && game.achievements" class="game-achievements">
                            🏆 {{ game.user_achievements }}/{{ game.achievements }}
                        </div>
                        <div v-if="viewMode !== 'list'" class="status-bar" @click.stop>
                            <button v-for="s in statuses" :key="s.key"
                                class="status-btn"
                                :class="[`status-${s.key}`, { active: game.status === s.key }]"
                                :title="s.label"
                                @click="setStatus(game, s.key)">
                                <svg-icon :name="s.icon"/>
                            </button>
                        </div>
                    </div>
                    <div v-if="viewMode === 'list'" class="game-info">
                        <span class="game-name">{{ game.name }}</span>
                        <span class="game-status-badge" :class="`status-${displayStatus(game)}`">
                            {{ statusLabel(displayStatus(game)) }}
                        </span>
                        <span class="game-platform">{{ game.platform?.platform_name }}</span>
                        <span class="game-playtime">{{ Math.round(game.playtime / 60) }}h</span>
                        <span class="game-achievements" v-if="game.achievements">
                            {{ game.user_achievements }}/{{ game.achievements }} trophies
                        </span>
                    </div>
                </div>
            </div>

            <div ref="sentinel" class="scroll-sentinel"></div>
            <div v-if="loadingMore" class="loading-more-wrap">
                <loader/>
            </div>
            <div v-if="!loading && games.length > 0" class="games-counter">
                {{ allGames.length }}{{ hasMore ? '+' : '' }} / {{ totalGames }} games
            </div>

        </div>
        <game-detail-popup v-if="selectedGame" :game="selectedGame" @close="selectedGame = null" />
    </AppPage>
</template>

<script lang="ts" src="./library.ts"></script>
<style lang="scss" src="./library.scss"></style>
