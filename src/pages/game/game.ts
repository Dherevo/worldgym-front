import { Component, Vue, toNative } from "vue-facing-decorator";
import { http } from "lib";

interface GameDetail {
    id: number;
    name: string;
    icon: string;
    header: string;
    year: string;
    publisher: string;
    developer: string;
    platforms: { id: number; name: string; key: string }[];
}

interface PlayerData {
    id: number;
    status: string;
    platined: boolean;
    playtime: number;
    recent_playtime: number;
    achievements: { total: number; unlocked: number } | null;
}

interface SteamData {
    short_description: string;
    metacritic?: { score: number; url: string };
    genres?: { id: string; description: string }[];
    categories?: { id: number; description: string }[];
    screenshots?: { id: number; path_thumbnail: string; path_full: string }[];
    movies?: { id: number; name: string; thumbnail: string; hls_h264: string; highlight: boolean }[];
    recommendations?: { total: number };
    price_overview?: { final_formatted: string; discount_percent: number };
    background_raw?: string;
    ratings?: Record<string, { rating: string; descriptors?: string }>;
    reviews?: string;
}

@Component({})
class GamePage extends Vue {

    game: GameDetail | null = null;
    player: PlayerData | null = null;
    steam: SteamData | null = null;
    loading = true;
    lightboxImg: string | null = null;
    activeTrailer: string | null = null;

    readonly relevantCategories = [2, 1, 9, 38, 28]; // Single-player, Multi-player, Co-op, Online Co-op, Full controller support

    created() {
        const id = this.$route.params.id;
        http.get(`/games/${id}`)
        .then(response => {
            this.game   = response.game;
            this.player = response.player ?? null;
            if (response.info) {
                const appid = Object.keys(response.info)[0];
                const entry = response.info[appid];
                if (entry?.success) this.steam = entry.data;
            }
            this.loading = false;
        })
        .catch(() => {
            this.loading = false;
        });
    }

    get displayStatus(): string {
        if (!this.player) return '';
        return this.player.platined ? 'platined' : this.player.status;
    }

    get statusLabel(): string {
        const labels: Record<string, string> = {
            completed: 'Completed',
            playing: 'Playing',
            never: 'Not played',
            platined: 'Platined',
            blacklisted: 'Blacklisted',
        };
        return labels[this.displayStatus] ?? this.displayStatus;
    }

    get achPct(): number {
        const ach = this.player?.achievements;
        if (!ach?.total) return 0;
        return Math.round((ach.unlocked / ach.total) * 100);
    }

    get heroBg(): string {
        return this.steam?.background_raw ?? this.game?.header ?? '';
    }

    get filteredCategories() {
        return this.steam?.categories?.filter(c => this.relevantCategories.includes(c.id)) ?? [];
    }

    get parsedReviews(): { quote: string; score: string; source: string }[] {
        if (!this.steam?.reviews) return [];
        return this.steam.reviews
            .split('<br><br>')
            .map(block => block.replace(/<br>/g, '\n').replace(/&quot;/g, '"'))
            .filter(Boolean)
            .map(block => {
                const lines = block.split('\n').filter(Boolean);
                const quote = lines[0]?.replace(/^"|"$/g, '').trim() ?? '';
                const attribution = lines[1]?.trim() ?? '';
                const dashIdx = attribution.lastIndexOf('–');
                const score  = dashIdx > -1 ? attribution.slice(0, dashIdx).trim() : '';
                const source = dashIdx > -1 ? attribution.slice(dashIdx + 1).trim() : attribution;
                return { quote, score, source };
            })
            .filter(r => r.quote && r.source);
    }

    get ratings(): { label: string; value: string }[] {
        if (!this.steam?.ratings) return [];
        const map: Record<string, string> = { esrb: 'ESRB', pegi: 'PEGI', usk: 'USK' };
        return Object.entries(this.steam.ratings)
            .filter(([key]) => map[key])
            .map(([key, val]) => ({ label: map[key], value: val.rating.toUpperCase() }));
    }

    get releaseYear(): string {
        if (!this.game?.year) return '';
        return new Date(this.game.year).getFullYear().toString();
    }

    get metacriticColor(): string {
        const score = this.steam?.metacritic?.score ?? 0;
        if (score >= 75) return '#22c55e';
        if (score >= 50) return '#eab308';
        return '#ef4444';
    }
}
export default toNative(GamePage);
