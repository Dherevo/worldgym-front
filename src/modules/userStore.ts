import { reactive } from "vue";

interface UserData {
    id: string;
    name: string;
    email: string;
    nickname: string;
    avatar_url?: string | null;
    goal?: 'lose' | 'maintain' | 'gain' | null;
    height_cm: number | null;
    weight_kg: number | null;
    gender: 'female' | 'male' | 'other' | null;
    birth_date?: string | null;
    email_verified?: boolean;
    pending_email?: string | null;
    home_equipment: number[] | null;
    platforms: { id: number; name: string; key: string }[];
}

const userStore = reactive<{ data: UserData | null }>({
    data: null
});

export default userStore;
