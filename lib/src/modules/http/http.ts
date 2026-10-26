import axios from 'axios';
import HttpRequestAttempt from "./attempt";
import HttpError from "./error";
import HttpRequest from "./request";
import ApiToken from "./token";
import { HTTPMethod, RequestInterceptor, ResponseInterceptor } from "./types";

export default class http {

    public static baseURL: string = '';
    private static nextRequestIsRefresh: boolean = false;
    public static token: ApiToken = new ApiToken();

    private static pendingRequests: HttpRequest[] = [];
    private static addPendingRequest(request: HttpRequest, resolve: any, reject: any) {
        request.promiseCallbacks = {
            resolve, reject
        }
        this.pendingRequests.push(request);
    }
    private static rejectPendingRequests(err: HttpError) {
        for (const req of this.pendingRequests) {
            if (req.promiseCallbacks) {
                req.promiseCallbacks.reject(err);
            }
        }
        this.pendingRequests = [];
    }
    private static retryPendingRequests() {
        for (const req of this.pendingRequests) {
            if (!req.promiseCallbacks) continue;
            this.exec(req)
                .then(req.promiseCallbacks.resolve)
                .catch(req.promiseCallbacks.reject);
        }
        this.pendingRequests = [];
    }

    private static globalHeadersAction: (request: HttpRequest) => Promise<any>
        = () => Promise.resolve({})
    public static setGlobalHeaders(action: (request: HttpRequest) => Promise<any>) {
        this.globalHeadersAction = action;
    }

    private static collectHeaders(request: HttpRequest) {
        return new Promise((resolve, reject) => {

            const defaultHeaders: any = {
                'Content-Type': 'application/json'
            }

            const requestToken = request.tokenOverride;
            if (requestToken === undefined) {
                const tk = this.token.get();
                if (tk) {
                    defaultHeaders['Authorization'] = tk;
                }
            }
            else if (requestToken !== null) {
                defaultHeaders['Authorization'] = requestToken;
            }

            this.globalHeadersAction(request)
                .then(headers => {

                    // Merge into previous headers
                    Object.keys(defaultHeaders)
                        .forEach((k: string) => {
                            if (!headers[k]) {
                                headers[k] = defaultHeaders[k];
                            }
                        });

                    // Add specific request headers
                    if (request.headers) {
                        Object.keys(request.headers)
                            .forEach((k: string) => {
                                headers[k] = request.headers[k];
                            });
                    }

                    resolve(headers);

                })
                .catch(reject);

        })
    }

    private static requestInterceptors: RequestInterceptor[] = [];
    private static responseInterceptors: ResponseInterceptor[] = [];
    private static resolveRequestInterceptors(req: HttpRequestAttempt, index: number = 0): Promise<void> {
        return new Promise((resolve, reject) => {

            // If no more interceptors, end here
            if (index >= this.requestInterceptors.length) {
                return resolve();
            }

            // Run current interceptor
            this.requestInterceptors[index](req)
                .then(() => {

                    // Run next interceptor
                    this.resolveRequestInterceptors(req, index + 1)
                        .then(() => {
                            resolve();
                        })
                        .catch(err => {
                            reject(err);
                        })

                })

                // If interceptor rejected, return error. Request failed.
                .catch(err => {
                    reject(err);
                })
        })
    }
    private static resolveResponseInterceptors(response: any, request: HttpRequestAttempt, index: number = 0) {
        return new Promise((resolve, reject) => {

            // If no more interceptors, end here
            if (index >= this.responseInterceptors.length) {
                return resolve(response);
            }

            // Run current interceptor
            this.responseInterceptors[index](response, request)
                .then(() => {

                    this.resolveResponseInterceptors(response, request, index + 1)
                        .then(() => {
                            resolve(response);
                        })
                        .catch(err => {
                            reject(err);
                        })

                })

                // If interceptor rejected, return error. Request failed, even if it was a 200.
                .catch(err => {
                    reject(err);
                })
        })
    }

    public static exec(request: HttpRequest) {
        return new Promise((resolve, reject) => {

            // Check if this is a refresh request
            request.isRefresh = this.nextRequestIsRefresh;
            this.nextRequestIsRefresh = false;

            //// Check fake api
            if (request.fakeResponse) {
                setTimeout(() => {

                    const attempt = new HttpRequestAttempt(request);
                    attempt.url = this.baseURL + attempt.url;
                    attempt.applyDataFormat();

                    request.fakeResponse!(
                        response => this._onSuccess({
                            response: { data: response, status: 200, headers: {} },
                            attempt,
                            request,
                            resolve,
                            reject
                        }),
                        error => this._onError({
                            error,
                            attempt,
                            request,
                            resolve,
                            reject
                        })
                    );
                }, 250 + (Math.random() * 250));
                return;
            }
            ///////////

            this.collectHeaders(request)
                .then(headers => {

                    const attempt = new HttpRequestAttempt(request, headers);
                    attempt.url = this.baseURL + attempt.url;

                    this.resolveRequestInterceptors(attempt)
                        .then(() => {

                            attempt.applyDataFormat();

                            axios({
                                method: attempt.method,
                                url: attempt.url,
                                data: attempt.data,
                                headers: attempt.headers,
                                responseType: attempt.responseType ? attempt.responseType : 'json'
                            })
                                .then((response: any) => this._onSuccess({
                                    response,
                                    attempt,
                                    request,
                                    resolve,
                                    reject
                                }))
                                .catch((error: any) => this._onError({
                                    error,
                                    attempt,
                                    request,
                                    resolve,
                                    reject
                                }));

                        })
                        .catch(() => reject(new HttpError(attempt)))

                })
        })
    }

    private static _onSuccess($e: {
        response: any,
        attempt: HttpRequestAttempt,
        request: HttpRequest,
        resolve: (response: any) => void,
        reject: (error: any) => void
    }) {
        const { response, attempt, request, resolve, reject } = $e;

        // Run response interceptors
        this.resolveResponseInterceptors({
            error: false,
            response: response
        }, attempt)
            .then(() => {

                if (response.data) {
                    response.data = request.converter(response.data);
                }

                if (!attempt.fullResponse)
                    resolve(response.data);
                else
                    resolve(response);
            })

            // Rejected by interceptor
            .catch(reason => {
                const err = new HttpError(attempt, 0, reason);
                reject(err);
            });
    }

    private static _onError($e: {
        error: any,
        attempt: HttpRequestAttempt,
        request: HttpRequest,
        resolve: (response: any) => void,
        reject: (error: any) => void
    }) {

        const { error, attempt, request, resolve, reject } = $e;

        // Build the error information object:
        const err = new HttpError(attempt,
            /* status */ error.response ? error.response.status : 0,
            /* data */ error.response ? error.response.data :
                (
                    error.code || error.message ? {
                        code: error.code,
                        message: error.message
                    } : {}
                ),
            /* headers */ error.response ? error.response.headers : {}
        )

        // Run response interceptors first
        this.resolveResponseInterceptors({
            error: true,
            response: err
        }, attempt)
        .then(() => {

            // If token is being refreshed right now
            if (this.token.refreshing) {

                // And this request is also a refresh request
                if (request.isRefresh) {

                    // Makes no sense, two refresh requests at the same time
                    // So just reject
                    return reject(err);
                }

                // Else, add this request to the queue to be resolved later.
                this.addPendingRequest(request, resolve, reject);

            }

            // Check if token is expired
            this.token.CheckIfExpired(err)
            .then(expired => {

                // If token wasn't expired, it was a real error
                if (!expired) return reject(err);

                // If this request already tried to refresh the token and failed
                if (request.refreshConsumed) {
                    if (request.promiseCallbacks) {
                        request.promiseCallbacks.reject(err);
                    } else {
                        reject(err);
                    }
                    return;
                }

                // Start refreshing token
                this.token.refreshing = true;
                request.refreshConsumed = true;
                this.nextRequestIsRefresh = true;

                // Add this request to the queue to be resolved later.
                this.addPendingRequest(request, resolve, reject);

                this.token.Refresh()
                .then(refreshed => {

                    if (!refreshed) return this.rejectPendingRequests(err);

                    this.retryPendingRequests();

                })
                .catch(() => {
                    http.token.remove();
                    this.rejectPendingRequests(err);
                });

            })
            .catch(() => reject(err))

        })

        // If anythng fails, just reject
        .catch(() => reject(err))

    }

    private static generateRequest(method: HTTPMethod, url: string) {
        const req = new HttpRequest();
        req.setMethod(method);
        req.setUrl(url);
        return req;
    }

    public static request(url: string = '', data?: any) {
        const req = this.generateRequest('GET', url);
        if (data) {
            req.data(data);
        }
        return req;
    }

    public static get(url: string = '', data?: any) {
        return this.request(url, data);
    }

    public static post(url: string = '', data?: any) {
        const req = this.generateRequest('POST', url);
        if (data) {
            req.data(data);
        }
        return req;
    }

    public static put(url: string = '', data?: any) {
        const req = this.generateRequest('PUT', url);
        if (data) {
            req.data(data);
        }
        return req;
    }

    public static delete(url: string = '', data?: any) {
        const req = this.generateRequest('DELETE', url);
        if (data) {
            req.data(data);
        }
        return req;
    }

}