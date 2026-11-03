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

export type Goal = 'lose' | 'maintain' | 'gain';

// Sedentary expenditure: the trainings of each day are added on top, so the total follows what was really done
const SEDENTARY_FACTOR = 1.2;

export function baseExpenditure(bmr: number): number {
    return Math.round(bmr * SEDENTARY_FACTOR);
}

export function bmi(user: { weight_kg?: number | null; height_cm?: number | null } | null): number | null {
    const w = Number(user?.weight_kg);
    const h = Number(user?.height_cm) / 100;
    return w > 0 && h > 0 ? w / (h * h) : null;
}

// The chosen goal; without one, by BMI: from 25 up lose weight, otherwise build muscle
export function effectiveGoal(user: { goal?: string | null; weight_kg?: number | null; height_cm?: number | null } | null): Goal {
    if (user?.goal === 'lose' || user?.goal === 'maintain' || user?.goal === 'gain') return user.goal;
    const b = bmi(user);
    return b !== null && b >= 25 ? 'lose' : 'gain';
}

const round10 = (n: number) => Math.round(n / 10) * 10;

// Calories to eat in a day with the given expenditure: moderate deficit (never under the BMR), maintenance or small surplus
export function goalRange(goal: Goal, tdee: number, bmr: number): { min: number; max: number } {
    if (goal === 'lose') {
        const min = Math.max(bmr, round10(tdee * 0.80));
        return { min, max: Math.max(min, round10(tdee * 0.85)) };
    }
    if (goal === 'maintain') return { min: round10(tdee * 0.97), max: round10(tdee * 1.03) };
    return { min: round10(tdee * 1.05), max: round10(tdee * 1.10) };
}

// Protein to eat in a day, in grams. Per kg of a reference weight: with a BMI over 25 only a quarter of the
// excess weight counts (adjusted body weight), so that a high weight does not inflate the target.
const PROTEIN_PER_KG: Record<Goal, [number, number]> = { lose: [1.6, 2.2], maintain: [1.2, 1.6], gain: [1.6, 2.0] };

export function proteinRange(user: { weight_kg?: number | null; height_cm?: number | null } | null, goal: Goal): { min: number; max: number; ref: number } | null {
    const w = Number(user?.weight_kg);
    const h = Number(user?.height_cm) / 100;
    if (Number.isNaN(w) || Number.isNaN(h) || w <= 0 || h <= 0) return null;
    const normal = 25 * h * h;
    const ref = w > normal ? normal + 0.25 * (w - normal) : w;
    const [lo, hi] = PROTEIN_PER_KG[goal];
    const round5 = (n: number) => Math.round(n / 5) * 5;
    return { min: round5(ref * lo), max: round5(ref * hi), ref: Math.round(ref) };
}
