import utils from "../utils"
import http from "./http"
import { HTTPDataFormat, HTTPMethod, HTTPResponseType } from "./types"

export default class HttpRequest {

    method: HTTPMethod = 'GET'
    url: string = ''
    baseUrl?: string
    body: any = {}
    queryParams: any = {}
    headers: any = {}
    tokenOverride?: string | null;
    dataFormat: HTTPDataFormat = 'json';
    converter: ((response: any) => any) = (v: any) => v;
    isRefresh: boolean = false;
    responseType: HTTPResponseType = 'json';
    fullResponse: boolean = false;
    refreshConsumed: boolean = false;
    promiseCallbacks?: {
        resolve: (response: any) => void,
        reject: (error: any) => void
    }
    fakeResponse?: (resolve: (response: any) => void, reject: (error?: any) => void) => void

    useFake(faker:
        (
            resolve: (response: any) => void,
            reject: (error?: any) => void
        ) => void
    ): HttpRequest {
        this.fakeResponse = faker;
        return this;
    }

    setMethod(method: HTTPMethod): HttpRequest {
        this.method = method;
        return this;
    }

    transform(converter: (response: any) => any) {
        this.converter = converter;
        return this;
    }

    data(data: any): HttpRequest {
        if (typeof data == 'string') {
            this.body = data;
            return this;
        }

        const dta = utils.removeUndefined(data);

        if (this.method == 'GET') {
            this.setQueryParams(dta);
        } else {
            Object.keys(dta)
                .forEach((k: string) => {
                    this.body[k] = dta[k];
                })
        }
        return this;
    }

    setQueryParams(params: any) {
        Object.keys(params)
            .forEach((k: string) => {
                this.queryParams[k] = params[k];
            })
        return this;
    }

    setUrl(url: string): HttpRequest {
        this.url = url;
        return this;
    }

    setBaseURL(base: string): HttpRequest {
        this.baseUrl = base;
        return this;
    }

    setHeaders(headers: any): HttpRequest {
        this.headers = headers;
        return this;
    }

    setTokenOverride(token: string | null): HttpRequest {
        this.tokenOverride = token;
        return this;
    }

    setDataFormat(format: HTTPDataFormat): HttpRequest {
        this.dataFormat = format;
        return this;
    }

    setResponseType(type: HTTPResponseType) {
        this.responseType = type;
        return this;
    }

    promise() : Promise<any> {
        return http.exec(this);
    }

    then(callback: (value: any) => void) {
        return http.exec(this).then(callback);
    }

    getFullResponse() {
        this.fullResponse = true;
        return this;
    }

    generateUrl() {

        const data = this.body ?? {}

        let urlparams = '';
        let char = '?';
        const addParams = (data: any) => {
            Object.keys(data).forEach(k => {
                const val = data[k];

                if (Array.isArray(val)) {

                    for (const i of val) {
                        urlparams += char + k + '=' + encodeURIComponent(i);
                        char = '&';
                    }

                } else {
                    urlparams += char + k + '=' + encodeURIComponent(data[k]);
                    char = '&';
                }
            });
        }

        if ("GET" == this.method) {
            addParams(data);
        }

        addParams(this.queryParams);

        return (this.baseUrl ?? '') + this.url + urlparams;
    }

}