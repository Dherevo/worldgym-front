import { reactive } from "vue";

interface UserData {
    id: string;
    name: string;
    email: string;
    nickname: string;
    isAdmin: boolean;
    platforms: { id: number; name: string; key: string }[];
}

const userStore = reactive<{ data: UserData | null }>({
    data: null
});

export default userStore;
