import { Component, Vue, toNative, Watch } from "vue-facing-decorator";
import { http } from "lib";
import GameDetailPopup from "@/components/game-detail-popup/game-detail-popup.vue";

const STORAGE_KEY = 'library-prefs';

interface Game {
    id: number;
    name: string;
    icon: string;
    platform: {
        id: number;
        game_id: number;
        key: string;
        platform_id: number;
        platform_name: string;
    };
    status: string;
    platined: number;
    playtime: number;
    achievements: number;
    user_achievements: number;
}

interface StatusTotal {
    status: string;
    total: number;
}

@Component({ components: { GameDetailPopup } })
class LibraryPage extends Vue {

    selectedGame: Game | null = null;
    allGames: Game[] = [];
    games: Game[] = [];
    totals: StatusTotal[] = [];
    loading = true;
    loadingMore = false;
    hasMore = true;
    readonly pageSize = 50;
    currentOffset = 0;
    viewMode: 'grid-large' | 'grid-small' | 'list' = 'grid-large';
    hiddenStatuses: Set<string> = new Set();
    orderBy = 'name';
    orderDir: 'asc' | 'desc' = 'asc';
    search = '';
    errorMsg = '';
    private searchDebounce: ReturnType<typeof setTimeout> | null = null;
    private errorTimer: ReturnType<typeof setTimeout> | null = null;
    private boundOnScroll: (() => void) | null = null;
    private lastScrollTime = 0;

    readonly allStatuses = ['never', 'playing', 'completed', 'blacklisted'];

    readonly sortOptions = [
        { key: 'name',       label: 'Name'     },
        { key: 'playtime',   label: 'Playtime' },
        { key: 'status',     label: 'Status'   },
        { key: 'updated_at', label: 'Recent'   },
    ];

    readonly circ = 2 * Math.PI * 35;

    readonly statusColors: Record<string, string> = {
        completed: '#22c55e',
        playing: '#3b82f6',
        never: '#f97316',
        platined: '#eab308',
        blacklisted: '#ef4444',
    };

    get totalGames(): number {
        return this.totals.reduce((acc, t) => acc + t.total, 0);
    }

    get chartSegments() {
        const sum = this.totalGames;
        let accumulated = 0;
        return this.totals.map(t => {
            const len = sum ? (t.total / sum) * this.circ : 0;
            const offset = -accumulated;
            accumulated += len;
            return { status: t.status, color: this.statusColors[t.status] ?? '#888', len, offset };
        });
    }

    readonly statuses = [
        { key: 'never',     icon: 'radix/circle-backslash', label: 'Not played' },
        { key: 'playing',   icon: 'radix/play',             label: 'Playing'    },
        { key: 'completed', icon: 'radix/check-circled',    label: 'Completed'  },
        { key: 'blacklisted',   icon: 'radix/minus-circled',    label: 'Blacklisted'    },
    ];

    created() {
        this.loadPrefs();
        this.fetchLibrary();
    }

    mounted() {
        this.boundOnScroll = () => {
            const now = Date.now();
            if (now - this.lastScrollTime < 150) return;
            this.lastScrollTime = now;
            if (this.loadingMore || this.loading || !this.hasMore) return;
            const sentinel = this.$refs.sentinel as Element;
            if (!sentinel) return;
            const rect = sentinel.getBoundingClientRect();
            if (rect.bottom <= window.innerHeight + 200) this.loadMore();
        };
        document.addEventListener('scroll', this.boundOnScroll, { capture: true, passive: true });
    }

    unmounted() {
        if (this.boundOnScroll) {
            document.removeEventListener('scroll', this.boundOnScroll, { capture: true });
        }
        if (this.searchDebounce) clearTimeout(this.searchDebounce);
        if (this.errorTimer) clearTimeout(this.errorTimer);
    }

    showError(msg: string) {
        this.errorMsg = msg;
        if (this.errorTimer) clearTimeout(this.errorTimer);
        this.errorTimer = setTimeout(() => { this.errorMsg = ''; }, 4000);
    }

    scrollToTop() {
        const content = document.querySelector('#backoffice-content') as Element;
        (content ?? document.documentElement).scrollTo({ top: 0 });
    }

    clearSearch() {
        this.search = '';
        this.fetchLibrary();
    }

    loadPrefs() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (!saved) return;
            const prefs = JSON.parse(saved);
            if (prefs.viewMode)       this.viewMode       = prefs.viewMode;
            if (prefs.orderBy)        this.orderBy        = prefs.orderBy;
            if (prefs.orderDir)       this.orderDir       = prefs.orderDir;
            if (prefs.hiddenStatuses) this.hiddenStatuses = new Set(prefs.hiddenStatuses);
        } catch { /* sense localStorage */ }
    }

    savePrefs() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({
                viewMode: this.viewMode,
                orderBy: this.orderBy,
                orderDir: this.orderDir,
                hiddenStatuses: [...this.hiddenStatuses],
            }));
        } catch { /* sense localStorage */ }
    }

    @Watch('viewMode')
    onViewModeChange() { this.savePrefs(); }

    buildQuery(offset: number): string {
        const params = new URLSearchParams({
            orderBy: this.orderBy,
            orderDir: this.orderDir,
            offset: String(offset),
            pageSize: String(this.pageSize),
        });
        if (this.search.trim()) params.set('search', this.search.trim());
        const visible = this.allStatuses.filter(s => !this.hiddenStatuses.has(s));
        if (visible.length < this.allStatuses.length) {
            visible.forEach(s => params.append('status[]', s));
        }
        return `/library?${params.toString()}`;
    }

    fetchLibrary(scrollTop = true) {
        this.loading = true;
        this.hasMore = true;
        this.currentOffset = 0;
        this.allGames = [];
        this.games = [];
        if (scrollTop) this.scrollToTop();
        http.get(this.buildQuery(0))
        .then(response => {
            this.allGames      = response.games;
            this.totals        = response.total;
            this.currentOffset = response.games.length;
            this.hasMore       = response.games.length === this.pageSize;
            this.games         = [...this.allGames];
            this.loading       = false;
        })
        .catch(() => {
            this.loading = false;
        });
    }

    loadMore() {
        if (this.loadingMore || !this.hasMore || this.loading) return;
        this.loadingMore = true;
        http.get(this.buildQuery(this.currentOffset))
        .then(response => {
            this.allGames      = [...this.allGames, ...response.games];
            this.currentOffset += response.games.length;
            this.hasMore       = response.games.length === this.pageSize;
            this.games         = [...this.allGames];
            this.loadingMore   = false;
        })
        .catch(() => {
            this.loadingMore = false;
        });
    }

    onSearchInput() {
        if (this.searchDebounce) clearTimeout(this.searchDebounce);
        this.searchDebounce = setTimeout(() => this.fetchLibrary(false), 300);
    }

    setOrder(field: string) {
        if (this.orderBy === field) {
            this.orderDir = this.orderDir === 'asc' ? 'desc' : 'asc';
        } else {
            this.orderBy = field;
        }
        this.savePrefs();
        this.fetchLibrary();
    }

    toggleDir() {
        this.orderDir = this.orderDir === 'asc' ? 'desc' : 'asc';
        this.savePrefs();
        this.fetchLibrary();
    }

    toggleStatusFilter(status: string) {
        if (this.hiddenStatuses.has(status)) {
            this.hiddenStatuses.delete(status);
        } else {
            this.hiddenStatuses.add(status);
        }
        this.hiddenStatuses = new Set(this.hiddenStatuses);
        this.savePrefs();
        this.fetchLibrary();
    }

    flashGame(id: number) {
        const el = document.querySelector(`.game-card [data-id="${id}"]`);
        if (!el) return;
        el.classList.remove('status-flash');
        (el as HTMLElement).getBoundingClientRect(); // força reflow
        el.classList.add('status-flash');
        el.addEventListener('animationend', () => el.classList.remove('status-flash'), { once: true });
    }

    setStatus(game: Game, status: string) {
        if (game.status === status) return;
        const prev = game.status;
        game.status = status;
        this.flashGame(game.id);
        http.put(`/library/${game.id}/status`).data({ status })
        .then(() => {
            const fromTotal = this.totals.find(t => t.status === prev);
            const toTotal   = this.totals.find(t => t.status === status);
            if (fromTotal) fromTotal.total--;
            if (toTotal) toTotal.total++;
            else this.totals.push({ status, total: 1 });
            if (this.hiddenStatuses.has(status)) {
                this.allGames = this.allGames.filter(g => g.id !== game.id);
            }
            this.games = this.hiddenStatuses.size === 0
                ? [...this.allGames]
                : this.allGames.filter(g => !this.hiddenStatuses.has(g.status));
        })
        .catch(() => {
            game.status = prev;
            this.showError('Error updating status. Please try again.');
        });
    }

    pct(total: number): number {
        const sum = this.totals.reduce((acc, t) => acc + t.total, 0);
        if (!sum) return 0;
        return Math.round((total / sum) * 100);
    }

    displayStatus(game: Game): string {
        return game.platined ? 'platined' : game.status;
    }

    statusLabel(status: string): string {
        const labels: Record<string, string> = {
            completed: 'Completed',
            playing: 'Playing',
            never: 'Not played',
            platined: 'Platined',
            blacklisted: 'Blacklisted',
        };
        return labels[status] ?? status;
    }
}
export default toNative(LibraryPage);
