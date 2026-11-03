import { http, Config, HttpError, translate } from "lib";

export default () => {

    http.baseURL = Config.get('api.url');

    http.setGlobalHeaders(() => Promise.resolve({
        'Accept-Language': translate.currentLanguage
    }));

    http.token.CheckIfExpired = (err: HttpError) => new Promise(resolve => {
        const token = http.token.get();
        if (token && err.status == 401) {
            resolve(true);
        } else {
            resolve(false);
        }
    });

    // The session cannot be renewed: leave a notice for the login page and go there
    const expireSession = () => {
        http.token.remove();
        try { sessionStorage.setItem('sessionExpired', '1'); } catch { /* storage unavailable */ }
        window.location.href = '/login';
    };

    http.token.Refresh = () => new Promise((resolve, reject) => {
        const refreshToken = http.token.getRefreshToken();
        if (!refreshToken) { expireSession(); return reject(); }

        http.post('/auth/refresh')
        .data({ refreshToken })
        .then((response: any) => {
            const data = response.data ?? response;
            if (data.access) {
                http.token.setInStorage(`Bearer ${data.access}`, data.refresh);
                resolve(true);
            } else {
                expireSession();
                reject();
            }
        })
        .catch((err: any) => {
            // A rejected refresh token ends the session; a network failure only fails this request
            if (err?.status === 400 || err?.status === 401 || err?.status === 403) expireSession();
            reject();
        });
    });
}
