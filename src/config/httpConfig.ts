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

    http.token.Refresh = () => new Promise((resolve, reject) => {
        const refreshToken = http.token.getRefreshToken();
        if (!refreshToken) return reject();

        http.post('/auth/refresh')
        .data({ refresh_token: refreshToken })
        .then((response: any) => {
            const data = response.data ?? response;
            if (data.access) {
                http.token.setInStorage(`Bearer ${data.access}`, data.refresh);
                resolve(true);
            } else if (data.error === 'token.invalid') {
                http.token.remove();
                window.location.href = '/login';
                reject();
            } else {
                reject();
            }
        })
        .catch((err: any) => {
            if (err?.error === 'token.invalid' || err?.data?.error === 'token.invalid') {
                http.token.remove();
                window.location.href = '/login';
            }
            reject();
        });
    });
}
