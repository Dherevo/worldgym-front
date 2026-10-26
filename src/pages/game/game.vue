<template>
    <AppPage name="game-page" layout="backoffice">
        <div id="game-page">

            <div v-if="loading" class="loading-wrap">
                <loader />
            </div>

            <div v-else-if="!game" class="game-not-found">
                <svg-icon name="radix/magnifying-glass" />
                <p>Game not found</p>
                <button @click="to('/library')">Back to library</button>
            </div>

            <template v-else>

                <!-- Hero -->
                <div class="game-hero" :style="heroBg ? `--hero-bg: url('${heroBg}')` : ''">
                    <div class="game-hero-bg"></div>
                    <div class="game-hero-content">
                        <button class="back-btn" @click="to('/library')">
                            <svg-icon name="radix/arrow-left" /> Library
                        </button>
                        <div class="game-hero-body">
                            <img :src="game.icon" :alt="game.name" class="game-icon-img"
                                @load="(e) => e.target.classList.add('loaded')" />
                            <div class="game-hero-info">
                                <h1 class="game-title">{{ game.name }}</h1>
                                <div class="game-tags">
                                    <span v-if="releaseYear" class="game-tag">{{ releaseYear }}</span>
                                    <span v-if="game.developer" class="game-tag">{{ game.developer }}</span>
                                    <span v-for="g in steam?.genres" :key="g.id" class="game-tag genre-tag">{{ g.description }}</span>
                                    <span v-for="p in game.platforms" :key="p.id" class="game-tag platform-tag">{{ p.name }}</span>
                                </div>
                                <div class="game-tags" v-if="filteredCategories.length">
                                    <span v-for="c in filteredCategories" :key="c.id" class="game-tag category-tag">{{ c.description }}</span>
                                </div>
                                <div class="game-badges">
                                    <div v-if="steam?.metacritic" class="metacritic-badge" :style="`--mc-color: ${metacriticColor}`">
                                        <span class="mc-score">{{ steam.metacritic.score }}</span>
                                        <span class="mc-label">Metacritic</span>
                                    </div>
                                    <div v-for="r in ratings" :key="r.label" class="rating-badge">
                                        <span class="rating-label">{{ r.label }}</span>
                                        <span class="rating-value">{{ r.value }}</span>
                                    </div>
                                    <div v-if="steam?.recommendations" class="rec-badge">
                                        <svg-icon name="radix/thumb-up" />
                                        {{ steam.recommendations.total.toLocaleString() }} recommendations
                                    </div>
                                    <div v-if="steam?.price_overview" class="price-badge">
                                        <span v-if="steam.price_overview.discount_percent > 0" class="price-discount">
                                            -{{ steam.price_overview.discount_percent }}%
                                        </span>
                                        {{ steam.price_overview.final_formatted }}
                                    </div>
                                </div>
                                <div v-if="player" class="game-player-info">
                                    <span class="game-status-tag" :class="`status-${displayStatus}`">{{ statusLabel }}</span>
                                    <div class="game-stats">
                                        <div class="stat-item">
                                            <span class="stat-value">{{ Math.round(player.playtime / 60) }}</span>
                                            <span class="stat-label">Hours played</span>
                                        </div>
                                        <div v-if="player.achievements" class="stat-item">
                                            <span class="stat-value">{{ player.achievements.unlocked }}/{{ player.achievements.total }}</span>
                                            <span class="stat-label">Achievements</span>
                                        </div>
                                        <div v-if="player.achievements" class="stat-item">
                                            <span class="stat-value">{{ achPct }}%</span>
                                            <span class="stat-label">Completion</span>
                                        </div>
                                    </div>
                                </div>
                                <div v-else class="game-not-in-library">Not in your library</div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Body -->
                <div class="game-body">

                    <p v-if="steam?.short_description" class="game-description">
                        {{ steam.short_description }}
                    </p>

                    <!-- Press reviews -->
                    <div v-if="parsedReviews.length" class="reviews-section">
                        <h3 class="section-title">Press reviews</h3>
                        <div class="reviews-list">
                            <div v-for="(r, i) in parsedReviews" :key="i" class="review-item">
                                <p class="review-quote">"{{ r.quote }}"</p>
                                <div class="review-attribution">
                                    <span v-if="r.score" class="review-score">{{ r.score }}</span>
                                    <span class="review-source">{{ r.source }}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Trailers -->
                    <div v-if="steam?.movies?.length" class="trailers-section">
                        <h3 class="section-title">Trailers</h3>
                        <div class="trailers-scroll">
                            <div v-for="movie in steam.movies" :key="movie.id"
                                class="trailer-thumb-wrap"
                                @click="activeTrailer = movie.hls_h264">
                                <img :src="movie.thumbnail" :alt="movie.name" class="trailer-thumb"
                                    @load="(e) => e.target.classList.add('loaded')" />
                                <div class="trailer-play-icon">
                                    <svg-icon name="radix/play" />
                                </div>
                                <span class="trailer-name">{{ movie.name }}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Screenshots -->
                    <div v-if="steam?.screenshots?.length" class="screenshots-section">
                        <h3 class="section-title">Screenshots</h3>
                        <div class="screenshots-scroll">
                            <img v-for="ss in steam.screenshots" :key="ss.id"
                                :src="ss.path_thumbnail" alt="Screenshot"
                                class="screenshot-thumb"
                                @click="lightboxImg = ss.path_full"
                                @load="(e) => e.target.classList.add('loaded')" />
                        </div>
                    </div>

                </div>

                <!-- Image lightbox -->
                <div v-if="lightboxImg" class="lightbox" @click="lightboxImg = null">
                    <img :src="lightboxImg" class="lightbox-img" />
                </div>

                <!-- Trailer lightbox -->
                <div v-if="activeTrailer" class="lightbox trailer-lightbox" @click.self="activeTrailer = null">
                    <button class="lightbox-close" @click="activeTrailer = null">×</button>
                    <video :src="activeTrailer" class="trailer-video" controls autoplay></video>
                </div>

            </template>

        </div>
    </AppPage>
</template>

<script lang="ts" src="./game.ts"></script>
<style lang="scss" src="./game.scss"></style>
