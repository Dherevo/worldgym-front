import { http, translate } from "lib";

// Categories of the foods (fruit, meat...) with their subcategories (one level). The list is loaded once and kept.
export interface FoodCategory {
    id: number;
    parent_id: number | null;
    slug: string;
    name: string;
}

let cached: Promise<FoodCategory[]> | null = null;

export function loadFoodCategories(): Promise<FoodCategory[]> {
    if (!cached) {
        cached = http.get('/food-categories')
        .then((res: any) => (res.items ?? []) as FoodCategory[])
        .catch(() => { cached = null; return [] as FoodCategory[]; });
    }
    return cached;
}

// The default categories are translated by their slug; the ones an admin adds show their own name
export function categoryName(c: FoodCategory): string {
    const key = `foodAdd.cat.${c.slug}`;
    const t = translate.get(key);
    return t && t !== key ? t : c.name;
}

export function topCategories(all: FoodCategory[]): FoodCategory[] {
    return all.filter(c => c.parent_id === null);
}

export function childrenOf(all: FoodCategory[], id: number): FoodCategory[] {
    return all.filter(c => c.parent_id === id);
}
