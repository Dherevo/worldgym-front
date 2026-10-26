import HttpRequestAttempt from "./attempt";

export type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export type HTTPDataFormat = 'json' | 'formData' | 'urlencoded' | 'plain' | 'html' | 'xml';

export type HTTPResponseType = 'json' | 'blob' | 'text';

export type RequestInterceptor = (request: HttpRequestAttempt) => Promise<void>
export type ResponseInterceptor = (response: any, request: HttpRequestAttempt) => Promise<any>