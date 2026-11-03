<template>
    <AppPage name="challenges-page" layout="backoffice">
        <div class="challenges-page">
            <h1><svg-icon name="awesome-solid/trophy" class="title-icon"/> {{ $t('challenges.title') }}</h1>

            <div class="medals-card" v-if="medals">
                <div class="medals-title">{{ $t('challenges.medals.title') }}</div>
                <div v-if="hasMedals" class="medals-row">
                    <span class="medal">🥇 <b>{{ medals.gold }}</b> <small>{{ $t('challenges.medals.gold') }}</small></span>
                    <span class="medal">🥈 <b>{{ medals.silver }}</b> <small>{{ $t('challenges.medals.silver') }}</small></span>
                    <span class="medal">🥉 <b>{{ medals.bronze }}</b> <small>{{ $t('challenges.medals.bronze') }}</small></span>
                    <span class="medal months">🏆 <b>{{ medals.months_won }}</b> <small>{{ $t('challenges.medals.monthsWon') }}</small></span>
                </div>
                <p v-else class="muted">{{ $t('challenges.medals.none') }}</p>
            </div>

            <div class="tabs" role="tablist">
                <button type="button" class="tab" :class="{ active: tab === 'ranking' }" @click="tab = 'ranking'">{{ $t('challenges.tabs.ranking') }}</button>
                <button type="button" class="tab" :class="{ active: tab === 'available' }" @click="tab = 'available'">{{ $t('challenges.tabs.available') }}</button>
            </div>

            <p v-if="loading && !challenges.length" class="muted">{{ $t('challenges.loading') }}</p>

            <!-- Ranking of the joined challenge -->
            <template v-else-if="tab === 'ranking'">
                <div v-if="!joined.length" class="empty">
                    <p>{{ $t('challenges.emptyRanking') }}</p>
                    <button type="button" class="btn" @click="tab = 'available'">{{ $t('challenges.goToAvailable') }}</button>
                </div>

                <template v-else>
                    <div v-if="joined.length > 1" class="chips">
                        <button v-for="c in joined" :key="c.id" type="button" class="chip" :class="{ active: c.id === selectedId }" @click="select(c.id)">{{ c.title }}</button>
                    </div>

                    <p v-if="loadingDetail && !detail" class="muted">{{ $t('challenges.loading') }}</p>

                    <div v-if="detail" class="card">
                        <div class="card-head">
                            <h2>{{ detail.title }}</h2>
                            <span class="range">{{ range(detail) }}</span>
                        </div>
                        <p v-if="detail.description" class="muted">{{ detail.description }}</p>

                        <template v-if="detail.my">
                            <div class="progress-text">
                                {{ $t('challenges.progress', { done: fmt(detail.my.total), goal: fmt(detail.goal), unit: unit(detail) }) }}
                                <span class="pos">{{ medalIcon(detail.my.position) }} {{ $t('challenges.position', { n: detail.my.position }) }}</span>
                            </div>
                            <div class="bar"><div class="fill" :style="{ width: percent(detail.my.total, detail.goal) + '%' }"></div></div>

                            <div class="today">
                                <b>{{ $t('challenges.today', { n: fmt(detail.my.today) }) }}</b>
                                <span v-if="detail.daily_min" class="muted"> · {{ $t('challenges.dailyMin', { n: fmt(detail.daily_min) }) }} — {{ dailyHint }}</span>
                            </div>

                            <div class="days-title">{{ $t('challenges.days') }}</div>
                            <div class="days">
                                <span v-for="d in detail.my.days" :key="d.date" class="day"
                                    :class="{ hit: d.reached_min === true, miss: d.reached_min === false, has: d.value > 0 }"
                                    :title="d.date + ': ' + fmt(d.value)">{{ dayLabel(d.date) }}</span>
                            </div>
                        </template>

                        <h3>{{ $t('challenges.ranking') }}</h3>
                        <ol class="ranking">
                            <li v-for="r in detail.ranking" :key="r.username" :class="{ me: r.is_me }">
                                <span class="pos">{{ medalIcon(r.position) || r.position }}</span>
                                <UserAvatar :url="r.avatar_url" :name="r.username" :size="34" />
                                <span class="name">{{ r.username }}<small v-if="r.is_me"> ({{ $t('challenges.you') }})</small></span>
                                <span class="medals-mini" v-if="r.medals.gold + r.medals.silver + r.medals.bronze">
                                    <template v-if="r.medals.gold">🥇{{ r.medals.gold }}</template>
                                    <template v-if="r.medals.silver"> 🥈{{ r.medals.silver }}</template>
                                    <template v-if="r.medals.bronze"> 🥉{{ r.medals.bronze }}</template>
                                </span>
                                <span class="total">{{ fmt(r.total) }}</span>
                            </li>
                        </ol>

                        <button type="button" class="btn-link" @click="leave(detail)">{{ $t('challenges.leave') }}</button>
                    </div>
                </template>
            </template>

            <!-- Challenges to join -->
            <template v-else>
                <p v-if="!challenges.length" class="muted">{{ $t('challenges.noAvailable') }}</p>
                <div v-for="c in challenges" :key="c.id" class="card">
                    <div class="card-head">
                        <h2>{{ c.title }}</h2>
                        <span class="range">{{ range(c) }}</span>
                    </div>
                    <p v-if="c.description" class="muted">{{ c.description }}</p>
                    <div class="meta">
                        <span>{{ $t('challenges.goal', { n: fmt(c.goal), unit: unit(c) }) }}</span>
                        <span v-if="c.daily_min">{{ $t('challenges.dailyMin', { n: fmt(c.daily_min) }) }}</span>
                        <span>{{ $t('challenges.participants', { n: c.participants }) }}</span>
                    </div>
                    <span v-if="c.joined" class="joined-badge">✓ {{ $t('challenges.joined') }}</span>
                    <button v-else type="button" class="btn" :disabled="joiningId === c.id" @click="join(c)">{{ $t('challenges.join') }}</button>
                </div>
            </template>
        </div>
    </AppPage>
</template>

<script lang="ts" src="./challenges.ts"></script>
<style lang="scss" src="./challenges.scss"></style>
