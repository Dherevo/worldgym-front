import { http } from "lib"
import userStore from "./userStore";

export default {

    isLoggedIn: () => new Promise((resolve, reject) => {
        const token = http.token.get();
        if (!token) {
            return reject();
        }
        resolve(true);
    }),

    fetchUserData: () => new Promise((resolve, reject) => {
        http.get('/userdata')
        .then(response => {
            userStore.data = response;
            resolve(response);
        })
        .catch(reject)
    }),

    // Height, weight and gender are asked once on an intermediate screen
    needsProfile: (user: any): boolean => !user?.height_cm || !user?.weight_kg || !user?.gender,

    login: (username: string, password: string) => new Promise((resolve, reject) => {
        http.post('/auth/login')
        .data({ username, password })
        .then(response => {
            if (response.access) {
                http.token.setInStorage(`Bearer ${response.access}`, response.refresh);
            }
            resolve(response);
        })
        .catch(reject)
    }),

    logout: () => {
        http.token.remove();
        userStore.data = null;
    }

}
