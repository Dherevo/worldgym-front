import userStore from "@/modules/userStore";

// Rough energy estimate: kcal = MET x body weight (kg) x hours. 4.5 is a moderate resistance-training MET
// counting the rests of a normal session. It is an approximation (typically +-25%), good to compare sessions.
const MET = 4.5;
const DEFAULT_SET_SECONDS = 40;
const DEFAULT_REST_SECONDS = 60;

export function bodyWeight(): number | null {
    const w = Number(userStore.data?.weight_kg);
    return w > 0 ? w : null;
}

export function kcalFromSeconds(seconds: number): number | null {
    const w = bodyWeight();
    if (!w || seconds <= 0 || Number.isNaN(seconds)) return null;
    return Math.round(MET * w * seconds / 3600);
}

// Time of a list of sets: what each set lasted plus the rest after it
export function setsSeconds(sets: { duration_seconds?: number | null; rest_seconds?: number | null }[]): number {
    return sets.reduce((sum, s) => sum + (Number(s.duration_seconds) || DEFAULT_SET_SECONDS) + Math.min(Number(s.rest_seconds ?? DEFAULT_REST_SECONDS) || 0, 600), 0);
}

// Planned sets of a routine exercise
export function plannedSeconds(setsTarget: number | null, restSeconds: number | null): number {
    return (Number(setsTarget) || 0) * (DEFAULT_SET_SECONDS + (Number(restSeconds ?? DEFAULT_REST_SECONDS) || 0));
}

export function kcalLabel(kcal: number | null): string {
    return kcal ? `≈ ${kcal} kcal` : '';
}
