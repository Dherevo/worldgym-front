import { reactive } from "vue";

interface UserData {
    id: string;
    name: string;
    email: string;
    nickname: string;
    isAdmin: boolean;
    height_cm: number | null;
    weight_kg: number | null;
    gender: 'female' | 'male' | 'other' | null;
    platforms: { id: number; name: string; key: string }[];
}

const userStore = reactive<{ data: UserData | null }>({
    data: null
});

export default userStore;
