import { proteinRange } from "@/modules/calories";
import type { Goal } from "@/modules/calories";

// Daily targets of the other nutrients, worked out from the calorie target and the protein range.
// Protein and fat are the floors; the carbohydrates are what is left of the calories.
export interface MacroTargets {
    fat: { min: number; max: number };
    carbs: number;
    fiber: number;
    // Saturated fat and sodium (mg) are ceilings, not goals
    saturatesMax: number;
    sodiumMax: number;
}

const round5 = (n: number) => Math.round(n / 5) * 5;

export function macroTargets(user: { weight_kg?: number | null; height_cm?: number | null } | null, goal: Goal, kcalMin: number, kcalMax: number): MacroTargets | null {
    const protein = proteinRange(user, goal);
    if (!protein || !kcalMax || kcalMax <= 0) return null;

    const kcal = (kcalMin + kcalMax) / 2;
    // 0.8 - 1 g of fat per kg of reference weight (the same one that gives the protein)
    const fat = { min: round5(protein.ref * 0.8), max: round5(protein.ref * 1.0) };
    const proteinMid = (protein.min + protein.max) / 2;
    const fatMid = (fat.min + fat.max) / 2;
    const carbs = Math.max(0, round5((kcal - proteinMid * 4 - fatMid * 9) / 4));

    return {
        fat,
        carbs,
        fiber: Math.round((kcal / 1000) * 14),
        saturatesMax: Math.round((kcal * 0.1) / 9),
        sodiumMax: 2300,
    };
}
