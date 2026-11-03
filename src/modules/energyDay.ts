import { http } from "lib";
import userStore from "@/modules/userStore";
import auth from "@/modules/auth";
import localDate from "@/modules/localDate";
import { activityLevel, baseExpenditure, basalMetabolicRate, effectiveGoal, goalRange, kcalFromSeconds, stepsKcal } from "@/modules/calories";
import type { Goal } from "@/modules/calories";

export interface EnergyDay {
    date: string;
    entries: any[];
    eaten: number;
    protein: number;
    bmr: number;
    base: number;
    workoutKcal: number;
    steps: number;
    stepsKcal: number;
    burned: number;
    goal: Goal;
    min: number;
    max: number;
    // false while the profile lacks the data to calculate the expenditure (date of birth)
    ready: boolean;
}

// Calories of the finished workouts of a day
async function workoutKcal(date: string): Promise<number> {
    const res: any = await http.get('/workouts').data({ date_from: date, date_to: date });
    let total = 0;
    for (const w of res.items ?? []) {
        if (w.status !== 'finished') continue;
        const secs = w.active_seconds ?? (w.started_at && w.finished_at ? Math.round((new Date(w.finished_at).getTime() - new Date(w.started_at).getTime()) / 1000) : 0);
        total += kcalFromSeconds(secs) ?? 0;
    }
    return total;
}

// Steps logged in the steps habit on a day (0 if none)
async function stepsOf(date: string): Promise<number> {
    const res: any = await http.get('/habits').data({ date });
    const habit = (res.habits ?? []).find((h: any) => h.key === 'steps');
    return Number(habit?.log?.value) || 0;
}

// What was eaten and burned on a day. Past days keep the figures saved back then; today (or a day without
// a saved snapshot) is calculated now and saved, so the follow-up keeps what was true each day.
export async function loadEnergyDay(date: string = localDate()): Promise<EnergyDay> {
    const day: any = await http.get('/nutrition/day').data({ date });
    // On a direct page load the profile may still be arriving; the calculation needs it
    if (!userStore.data) await auth.fetchUserData().catch(() => {});
    const saved = day.energy;
    const user = userStore.data;

    let bmr: number, base: number, workout: number, steps = 0, stepKcal: number, goal: Goal, min: number, max: number;
    if (saved && date !== localDate() && saved.goal_min !== null) {
        bmr = saved.bmr; base = saved.base_kcal; workout = saved.workout_kcal; stepKcal = saved.steps_kcal ?? 0;
        goal = saved.goal; min = saved.goal_min; max = saved.goal_max;
    } else {
        const b = basalMetabolicRate(user);
        if (!b) {
            return { date, entries: day.entries ?? [], eaten: day.kcal ?? 0, protein: day.protein_g ?? 0, bmr: 0, base: 0, workoutKcal: 0, steps: 0, stepsKcal: 0, burned: 0, goal: effectiveGoal(user), min: 0, max: 0, ready: false };
        }
        bmr = b;
        base = baseExpenditure(b, activityLevel(user));
        workout = await workoutKcal(date);
        steps = await stepsOf(date);
        stepKcal = stepsKcal(steps);
        goal = effectiveGoal(user);
        ({ min, max } = goalRange(goal, base + workout + stepKcal, bmr));
        http.put(`/nutrition/days/${date}`)
            .data({ bmr, base_kcal: base, workout_kcal: workout, steps_kcal: stepKcal, goal, goal_min: min, goal_max: max })
            .catch(() => {});
    }

    return {
        date, entries: day.entries ?? [], eaten: day.kcal ?? 0, protein: day.protein_g ?? 0,
        bmr, base, workoutKcal: workout, steps, stepsKcal: stepKcal, burned: base + workout + stepKcal, goal, min, max, ready: true,
    };
}
