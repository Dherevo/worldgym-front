import axios from 'axios';
import HttpRequestAttempt from "./attempt";
import HttpError from "./error";
import HttpRequest from "./request";
import ApiToken from "./token";
import HttpCache from "./cache";
import OfflineQueue from "./queue";
import { HTTPMethod, RequestInterceptor, ResponseInterceptor } from "./types";

export default class http {

    public static baseURL: string = '';
    // On: GET answers are kept (and served when there is no connection) and changes made offline wait in a queue
    public static offlineMode: boolean = false;
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
            this.execNetwork(req)
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

    // A GET that can be kept: its key, or null when it must always go to the API
    private static cacheKey(request: HttpRequest): string | null {
        if (request.method !== 'GET' || request.noCache || request.fakeResponse || request.fullResponse || request.hasConverter) return null;
        if (request.responseType !== 'json' || request.url.startsWith('/auth/')) return null;
        return this.baseURL + request.generateUrl();
    }

    private static queueable(request: HttpRequest): boolean {
        return request.method !== 'GET' && !request.noQueue && !request.fakeResponse && request.dataFormat === 'json'
            && !request.url.startsWith('/auth/');
    }

    // What the app calls: the cache and the queue of changes in front of the real request
    public static exec(request: HttpRequest): Promise<any> {
        // Cache and offline queue are for the installed app only (the web always asks the API)
        if (!this.offlineMode) return this.execNetwork(request) as Promise<any>;

        return new Promise((resolve, reject) => {
            const key = this.cacheKey(request);

            (async () => {
                if (key) {
                    await HttpCache.ready;
                    const hit = HttpCache.get(key);
                    // With changes waiting to be sent, what is kept may not include them: ask the API
                    if (hit?.fresh && !OfflineQueue.hasPending()) return resolve(hit.data);
                }

                // A change never overtakes the ones already waiting
                if (this.queueable(request) && OfflineQueue.hasPending()) return resolve(OfflineQueue.enqueue(request));

                this.execNetwork(request)
                .then((res: any) => {
                    if (key) HttpCache.set(key, res);
                    else if (request.method !== 'GET' && !request.url.startsWith('/auth/')) HttpCache.clear();
                    resolve(res);
                })
                .catch((err: any) => {
                    if (OfflineQueue.isNetworkFailure(err?.status ?? -1, err?.data)) {
                        // No connection: the last answer that was kept, or the change is saved to be sent later
                        const old = key ? HttpCache.get(key) : null;
                        if (old) return resolve(old.data);
                        if (this.queueable(request)) return resolve(OfflineQueue.enqueue(request));
                    }
                    reject(err);
                });
            })();
        });
    }

    // What the queue uses to send the waiting changes
    public static run(request: HttpRequest): Promise<any> {
        return (this.execNetwork(request) as Promise<any>).then(res => {
            HttpCache.clear();
            return res;
        });
    }

    private static execNetwork(request: HttpRequest) {
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
                return;

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

                    this.token.refreshing = false;
                    if (!refreshed) return this.rejectPendingRequests(err);

                    this.retryPendingRequests();

                })
                .catch(() => {
                    this.token.refreshing = false;
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

    public static patch(url: string = '', data?: any) {
        const req = this.generateRequest('PATCH', url);
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

OfflineQueue.init(req => http.run(req));
