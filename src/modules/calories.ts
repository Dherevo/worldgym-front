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

// Age in whole years from a "YYYY-MM-DD" date of birth
export function ageFromBirthDate(birth: string | null | undefined): number | null {
    if (!birth) return null;
    const d = new Date(birth);
    if (Number.isNaN(d.getTime())) return null;
    const now = new Date();
    let age = now.getFullYear() - d.getFullYear();
    if (now.getMonth() < d.getMonth() || (now.getMonth() === d.getMonth() && now.getDate() < d.getDate())) age--;
    return age >= 0 ? age : null;
}

// Basal metabolic rate, Mifflin-St Jeor: 10 x kg + 6.25 x cm - 5 x age + 5 (men) / -161 (women); "other" uses the average
export function basalMetabolicRate(user: { weight_kg?: number | null; height_cm?: number | null; gender?: string | null; birth_date?: string | null } | null): number | null {
    const age = ageFromBirthDate(user?.birth_date);
    const w = Number(user?.weight_kg);
    const h = Number(user?.height_cm);
    if (age === null || Number.isNaN(w) || Number.isNaN(h) || w <= 0 || h <= 0) return null;
    const base = 10 * w + 6.25 * h - 5 * age;
    const offset = user?.gender === 'male' ? 5 : user?.gender === 'female' ? -161 : -78;
    return Math.round(base + offset);
}

// Activity factor guessed from how often the user trains (sessions per week)
export function activityFactor(sessionsPerWeek: number): number {
    if (sessionsPerWeek < 0.5) return 1.2;
    if (sessionsPerWeek < 2) return 1.375;
    if (sessionsPerWeek < 4) return 1.55;
    if (sessionsPerWeek < 6) return 1.725;
    return 1.9;
}
