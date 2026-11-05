import userStore from "@/modules/userStore";

// Energy of a workout = time part + lifting part. It is an estimate (about +-15-20%), good to compare sessions.
// - Time part: MET x body weight (kg) x hours. 3.0 covers heart, breathing, rests and the after-workout burn,
//   without the lifting itself (that goes in the lifting part).
// - Lifting part: mechanical work (kg x 9.81 x range x reps) divided by the muscle efficiency (~25%).
// Without loads (a planned routine) the old flat MET of 4.5 is used, which already includes the lifting.
const MET_TIME = 3.0;
export const MET_PLANNED = 4.5;
const RANGE_M = 0.5;
const EFFICIENCY = 0.25;
const KCAL_PER_KG_REP = 9.81 * RANGE_M / EFFICIENCY / 4184;
// Share of the body weight that moves in a bodyweight exercise (push-ups, pull-ups, abs...)
const BODYWEIGHT_SHARE = 0.6;
const DEFAULT_SET_SECONDS = 40;
const DEFAULT_REST_SECONDS = 60;

export function bodyWeight(): number | null {
    const w = Number(userStore.data?.weight_kg);
    return w > 0 ? w : null;
}

function timeKcal(seconds: number, met: number): number {
    const w = bodyWeight();
    return w && seconds > 0 && !Number.isNaN(seconds) ? met * w * seconds / 3600 : 0;
}

// Kcal of lifting the logged sets (reps done, with the weight used; no weight = body weight)
function liftingKcal(sets: { reps?: number | null; weight?: number | string | null }[]): number {
    const bw = bodyWeight() ?? 0;
    return sets.reduce((sum, s) => {
        const reps = Number(s.reps);
        if (s.reps === null || s.reps === undefined || Number.isNaN(reps) || reps <= 0) return sum;
        const kg = Number(s.weight) > 0 ? Number(s.weight) : bw * BODYWEIGHT_SHARE;
        return sum + kg * reps * KCAL_PER_KG_REP;
    }, 0);
}

// Planned work (no loads known): time only, with the flat planned MET
export function kcalFromSeconds(seconds: number, met: number = MET_TIME): number | null {
    const k = timeKcal(seconds, met);
    return k > 0 ? Math.round(k) : null;
}

// A workout (or an exercise) with its time and the sets done
export function kcalFromSets(seconds: number, sets: { reps?: number | null; weight?: number | string | null }[]): number | null {
    if (!bodyWeight()) return null;
    const k = timeKcal(seconds, MET_TIME) + liftingKcal(sets);
    return k > 0 ? Math.round(k) : null;
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

export type Activity = 'sedentary' | 'light' | 'active';

// How active the user is outside the gym (work, walking). The trainings and the steps of each day are added
// on top of this base, so the total follows what was really done.
const ACTIVITY_FACTOR: Record<Activity, number> = { sedentary: 1.2, light: 1.375, active: 1.55 };

export function activityLevel(user: { activity?: string | null } | null): Activity {
    return user?.activity === 'light' || user?.activity === 'active' ? user.activity : 'sedentary';
}

export function baseExpenditure(bmr: number, activity: Activity = 'sedentary'): number {
    return Math.round(bmr * ACTIVITY_FACTOR[activity]);
}

// Steps up to this many a day are already part of the base; only the ones above add calories
export const STEPS_BASELINE = 5000;
const KCAL_PER_STEP = 0.04;

export function stepsKcal(steps: number): number {
    return steps > STEPS_BASELINE ? Math.round((steps - STEPS_BASELINE) * KCAL_PER_STEP) : 0;
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
