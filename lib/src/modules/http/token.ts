import { Storage } from "../storage";
import HttpError from "./error";

export default class ApiToken {

    private token: string = '';
    private refreshToken: string = '';

    public refreshing: boolean = false;

    public get(): string { return this.token; }
    public getRefreshToken(): string { return this.refreshToken; }

    public remove() {
        this.token = '';
        this.refreshToken = '';
        Storage.remove('token');
        Storage.remove('refreshToken');
    }

    public set(token: string, refreshToken?: string) {
        this.token = token;
        if (refreshToken) {
            this.refreshToken = refreshToken;
        }
    }

    public loadFromStorage() {
        const tk = Storage.get('token');
        const rtk = Storage.get('refreshToken');
        if (tk) {
            this.set(tk, rtk);
        }
    }

    public setInStorage(token: string, refreshToken?: string) {
        this.set(token, refreshToken);
        Storage.set('token', token);
        Storage.set('refreshToken', refreshToken);
    }

    public CheckIfExpired: (error: HttpError) => Promise<boolean>
    = () => Promise.resolve(false)

    public Refresh: () => Promise<boolean>
        = () => Promise.resolve(false)

}