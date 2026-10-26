import HttpRequestAttempt from "./attempt";
import { HTTPMethod } from "./types"

export default class HttpError {

    url: string
    method: HTTPMethod
    status: number;
    data: any
    headers: any

    public constructor(attempt: HttpRequestAttempt, status: number = 0, data: any = {}, headers: any = {}) {
        this.url = attempt.url;
        this.method = attempt.method;
        this.status = status;
        this.data = data;
        this.headers = headers;
    }

}