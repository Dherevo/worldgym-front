import userStore from "@/modules/userStore";

interface ExerciseMedia {
    lottie_men_url?: string | null;
    lottie_women_url?: string | null;
    gif_url?: string | null;
}

// Which animation an exercise shows: the Lottie of the user's gender, then the other Lottie, then the image or GIF
// (kept for the exercises users create themselves). Women see the women one; everybody else the men one
export function lottieUrl(ex: ExerciseMedia | null | undefined): string | null {
    if (!ex) return null;
    const women = userStore.data?.gender === 'female';
    return (women ? ex.lottie_women_url || ex.lottie_men_url : ex.lottie_men_url || ex.lottie_women_url) || null;
}

export function hasMedia(ex: ExerciseMedia | null | undefined): boolean {
    return !!(lottieUrl(ex) || ex?.gif_url);
}
