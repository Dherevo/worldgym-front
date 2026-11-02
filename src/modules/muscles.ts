// Main muscles worked by an exercise, e.g. "Quàdriceps" or "Pectoral major, Tríceps"
// (first the primary ones; if none is marked as primary, the first muscle)
export function primaryMuscleNames(exercise: any): string {
    const muscles: any[] = exercise?.muscles ?? [];
    const primary = muscles.filter(m => m.pivot?.is_primary);
    const main = primary.length ? primary : muscles.slice(0, 1);
    return main.map(m => m.name).filter(Boolean).join(', ');
}
