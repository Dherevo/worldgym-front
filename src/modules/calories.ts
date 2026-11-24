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

// Steps up to this many a day are already part of the base (the more active the lifestyle, the more steps the base
// already counts); only the ones above add calories
const STEPS_BASELINE: Record<Activity, number> = { sedentary: 5000, light: 7500, active: 10000 };

export function stepsBaseline(user: { activity?: string | null } | null): number {
    return STEPS_BASELINE[activityLevel(user)];
}
const FALLBACK_KCAL_PER_STEP = 0.04;

// Net cost of walking ≈ 0.5 kcal per kg and km; stride ≈ 0.415 × height. Without weight or height, a fixed average
export function kcalPerStep(user: { weight_kg?: number | null; height_cm?: number | null } | null): number {
    const w = Number(user?.weight_kg);
    const h = Number(user?.height_cm) / 100;
    return w > 0 && h > 0 ? (0.5 * w * 0.415 * h) / 1000 : FALLBACK_KCAL_PER_STEP;
}

export function stepsKcal(steps: number, user: { weight_kg?: number | null; height_cm?: number | null; activity?: string | null } | null = null): number {
    const baseline = stepsBaseline(user);
    return steps > baseline ? Math.round((steps - baseline) * kcalPerStep(user)) : 0;
}

export function bmi(user: { weight_kg?: number | null; height_cm?: number | null } | null): number | null {
    const w = Number(user?.weight_kg);
    const h = Number(user?.height_cm) / 100;
    return w > 0 && h > 0 ? w / (h * h) : null;
}

// Waist divided by height: under 0.5 is a lean waist, so a high BMI is probably muscle and not fat
export function waistRatio(user: { waist_cm?: number | null; height_cm?: number | null } | null): number | null {
    const waist = Number(user?.waist_cm);
    const height = Number(user?.height_cm);
    return waist > 0 && height > 0 ? waist / height : null;
}

// The chosen goal; without one, by BMI: from 25 up lose weight, otherwise build muscle. A high BMI with a lean waist
// (under half the height) suggests maintaining instead of losing. Same rule as the API (Support/Nutrition.php)
export function effectiveGoal(user: { goal?: string | null; weight_kg?: number | null; height_cm?: number | null; waist_cm?: number | null } | null): Goal {
    if (user?.goal === 'lose' || user?.goal === 'maintain' || user?.goal === 'gain') return user.goal;
    const b = bmi(user);
    if (b === null || b < 25) return 'gain';
    const r = waistRatio(user);
    return r !== null && r < 0.5 ? 'maintain' : 'lose';
}

const round10 = (n: number) => Math.round(n / 10) * 10;

// With a BMI from this up, losing weight keeps the eating goal fixed (it does not grow with the workouts and the steps),
// so the exercise adds to the deficit; and the deficit is capped so that it never goes over MAX_DEFICIT kcal a day
const FIXED_GOAL_BMI = 35;
const MAX_DEFICIT = 600;

// Weight loss per week the user can choose (kg); about 7700 kcal a kg, so the deficit of a day is kg x 1100
export const WEEKLY_LOSSES = [0.3, 0.5];
const KCAL_PER_KG_DAY = 1100;
// Exercise adds this much deficit on top of the chosen one before the eating goal grows; and eating never goes under this
const EXTRA_DEFICIT = 250;
const MIN_EAT_WOMAN = 1200;

export function weeklyLoss(user: { weekly_loss?: unknown } | null): number | null {
    const v = Number(user?.weekly_loss);
    return WEEKLY_LOSSES.includes(v) ? v : null;
}

export function lossDeficit(kgPerWeek: number): number {
    return round10(kgPerWeek * KCAL_PER_KG_DAY);
}

// Calories to eat in a day with the given expenditure: moderate deficit (never under the BMR), maintenance or small surplus.
// `base` (expenditure without workouts or extra steps), `bmi` and `loss` (kg a week) are only used to lose weight
export function goalRange(goal: Goal, tdee: number, bmr: number, opts: { base?: number; bmi?: number | null; loss?: number | null } = {}): { min: number; max: number } {
    if (goal === 'lose' && opts.loss) {
        // The user chose a pace: eat the base expenditure minus its deficit; the exercise is extra deficit up to EXTRA_DEFICIT
        const deficit = lossDeficit(opts.loss);
        const ref = opts.base ?? tdee;
        const floor = Math.max(MIN_EAT_WOMAN, round10(bmr * 0.85));
        let min = Math.max(floor, round10(ref - deficit - 30));
        let max = Math.max(min, round10(ref - deficit + 30));
        min = Math.max(min, round10(tdee - deficit - EXTRA_DEFICIT));
        max = Math.max(max, min);
        return { min, max };
    }
    if (goal === 'lose') {
        const fixed = opts.base !== undefined && (opts.bmi ?? 0) >= FIXED_GOAL_BMI;
        const ref = fixed ? (opts.base as number) : tdee;
        let min = Math.max(bmr, round10(ref * 0.80));
        let max = Math.max(min, round10(ref * 0.85));
        if (fixed) {
            // Exercise is net deficit, until it would pass the cap: then the goal rises to keep the deficit there
            min = Math.max(min, round10(tdee - MAX_DEFICIT));
            max = Math.max(max, min);
        }
        return { min, max };
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
