import { Component, Vue, Prop, toNative } from "vue-facing-decorator";
import { http } from "lib";

interface Achievement {
    id: number;
    name: string;
    description: string;
    icon: string | null;
    unlocked_at: string | null;
}

@Component({ emits: ['close'] })
class GameDetailPopup extends Vue {

    @Prop({ required: true }) game!: any;

    achievements: Achievement[] = [];
    loading = true;

    get displayStatus(): string {
        return this.game.platined ? 'platined' : this.game.status;
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
        if (!this.game.achievements) return 0;
        return Math.round((this.game.user_achievements / this.game.achievements) * 100);
    }

    mounted() {
        document.addEventListener('keydown', this.onKeydown);
        this.fetchAchievements();
    }

    unmounted() {
        document.removeEventListener('keydown', this.onKeydown);
    }

    onKeydown(e: KeyboardEvent) {
        if (e.key === 'Escape') this.$emit('close');
    }

    fetchAchievements() {
        const gameId = this.game.platform?.game_id;
        if (!gameId) { this.loading = false; return; }
        http.get(`/games/${gameId}/achievements`)
        .then(response => {
            this.achievements = response.achievements ?? response;
            this.loading = false;
        })
        .catch(() => {
            this.loading = false;
        });
    }

    formatDate(dateStr: string): string {
        return new Date(dateStr).toLocaleDateString();
    }

    goToDetail() {
        const gameId = this.game.platform?.game_id;
        this.$router.push({ path: `/games/${gameId}`, state: { game: JSON.parse(JSON.stringify(this.game)) } });
        this.$emit('close');
    }
}
export default toNative(GameDetailPopup);
