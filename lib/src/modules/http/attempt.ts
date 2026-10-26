import HttpRequest from "./request"
import { HTTPDataFormat, HTTPMethod, HTTPResponseType } from "./types"

export default class HttpRequestAttempt {

    method: HTTPMethod
    url: string
    data: any
    headers: any
    dataFormat: HTTPDataFormat
    responseType: HTTPResponseType
    fullResponse: boolean

    public constructor(request: HttpRequest, headers?: any) {
        this.method = request.method;
        this.url = request.generateUrl();
        this.data = request.body ?? {};
        this.headers = headers ?? request.headers;
        this.dataFormat = request.dataFormat;
        this.responseType = request.responseType;
        this.fullResponse = request.fullResponse;
    }

    private arrayToFormData(form: FormData, name: string, arr: any[]) {
        for (let i = 0; i < arr.length; ++i) {
            const obj = arr[i];
            if (typeof obj == 'object' && !(obj instanceof File)) {
                Object.keys(obj)
                    .forEach((key: string) => {
                        form.append(name + '[' + i + '].' + key, obj[key]);
                    });
            } else {
                /*
                No recordo perquè vaig posar aquestes condicions, feia falta 
                per a una API, però a un altre projecte no. Les APIs son irregulars.
                De moment ho treiem i dóna problemes ho veurem.
                */
                //if (!(obj instanceof File) || arr.length > 1)
                form.append(name + '[' + i + ']', obj);
                /*else
                    form.append(name, obj);*/
            }
        }
    }

    applyDataFormat() {
        if (this.method == 'GET') {
            return {};
        }

        // Body
        if (this.dataFormat == 'formData') {
            const form = new FormData();
            Object.keys(this.data)
                .forEach((key: string) => {
                    if (this.data[key] === undefined)
                        return;

                    if (this.data[key] === null) {
                        form.append(key, '');
                        return;
                    }

                    if (!Array.isArray(this.data[key]))
                        form.append(key, this.data[key]);
                    else {
                        this.arrayToFormData(form, key, this.data[key]);
                    }
                });
            delete this.headers['Content-Type'];
            this.data = form;
        }

        else if (this.dataFormat == 'urlencoded') {
            this.headers['Content-Type'] = 'application/x-www-form-urlencoded';
            this.data = new URLSearchParams(this.data);
        }

        else if (this.dataFormat == 'plain') {
            this.headers['Content-Type'] = 'text/plain';
        }

        else if (this.dataFormat == 'html') {
            this.headers['Content-Type'] = 'text/html';
        }

        else if (this.dataFormat == 'xml') {
            this.headers['Content-Type'] = 'text/xml';
        }

    }

}