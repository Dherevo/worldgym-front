import Validator from "./validator";

type UtilsType = {
    isFunction: (func: any) => boolean,
    queryParams: (empty?: boolean) => any,
    setQueryParams: (params: any, keepCurrentParams?: boolean) => void,
    loadFromQuery: (object: any) => any,
    dotNotation: (arr: any, key: string, defaultValue?: string|null) => any,
    invertList: (arr: any[]) => any[],
    areEqual: (a: any, b: any) => boolean,
    copy: (obj: any, options?: {
        copyArrays?: boolean,
        recursive?: boolean
    }, tree?: any[]) => any,
    copyArray: (arr: any[], options?: {
        copyObjects: boolean,
        copyArrays: boolean
    }, tree?: any[]) => any[],
    validateEmail: (email: string) => boolean,
    addToList: (list: any[]|null|undefined, items: any[], mapFunc?: (item: any) => any) => any[],
    randomString: (length?: number) => string,
    rand: (max?: number) => number,
    force: (obj: any, defaultValues: any) => any,
    merge: (objA: any, objB: any, mergeArrays?: boolean) => any,
    scrollBottomReached: (e: any, threshold : number) => any,
    fileToSrc: (file: any) => Promise<any>,
    fileExists: (path: string) => boolean,
    fetchFileContent: (path: string) => Promise<Blob>,
    fetchFile: (path: string, fileName: string) => Promise<File>,
    fileToURL: (file: File) => string,
    base64ToFile: (src: string, name: string) => File,
    base64ToBlob: (src: string) => Blob,
    capitalize: (text: string) => string,
    randomImage: (width?: number, height?: number, seed?: string) => string,
    hasExtension: (filename: string|File, extensions: string|string[]) => boolean,
    formatNumber: (num: any, decimals?: number) => string,
    getMIMETypes: () => any,
    getTypeFromMIME: (mime: string) => string,
    getMimeType: (extensionOrFile: string|File) => string,
    isImage: (file: File) => boolean,
    html2Text: (htmlText: string) => string,
    downloadFile: (file: File) => void,
    downloadBlob: (blob: Blob, name: string) => void,
    clipboard: (text: string) => void,
    downloadText: (text: string, filename: string) => void,
    separateWords: (text: string) => string[],
    cssVariable: (name: string, value?: string) => string,
    replaceVariables: (text: string, callback: (key: string) => string) => string,
    normalize: (text: string, replace?: any) => string,
    consecutivePromise: (list: any[], action: (item: any) => Promise<any>, index?: number) => Promise<any>,
    readFileContents: (file: File) => Promise<string>,
    removeUndefined: (obj: any) => any,
    onPressKey: (e: any, options?: {
        enter?: () => void,
        escape?: () => void,
        tab?: () => void
    }) => void,
    onStop: (key?: string, time?: number) => Promise<string>,
    extractProps: (obj: any, prop: string) => any,
    getImageSize: (src: string) => Promise<{ width: number, height: number }>,
    capImageSize: (file: File, maxWidth: number, maxHeight: number) => Promise<File>
}

const utils : UtilsType = {

    /**
     * Check if a variable is a function
     * 
     * @param func 
     * @returns booleam
     */
    isFunction(func: any) : boolean {
        return typeof func == 'function' || (func && {}.toString.call(func) === '[object Function]');
    },

    /**
     * Get query params from URL.
     * 
     * @return any
     */
    queryParams(empty: boolean = true) : any {
        const queryParams : any = new URLSearchParams(window.location.search);

        // Convert the query parameters to an object
        const paramsObject: any = {};
        for (const [key, value] of queryParams) {
            if (empty || (value !== undefined && value !== '' && value !== null)) {

                let val: any = value;
                if (val === 'true') val = true;
                else if (val === 'false') val = false;
                if (!isNaN(Number(value))) val = Number(value);

                paramsObject[key] = val;
            }
        }
        return paramsObject;
    },

    /**
     * Update the current URL to include new parameters.
     * 
     * @param params 
     * @param keepCurrentParams 
     */
    setQueryParams(params: any, keepCurrentParams: boolean = false) {
        const queryParams : any = new URLSearchParams(keepCurrentParams ? window.location.search : undefined);

        // Update the query parameters with the provided params object
        for (const key in params) {
            if (params[key] !== undefined)
                queryParams.set(key, params[key]);
            else
                queryParams.delete(key);
        }

        let count = 0;
        queryParams.forEach(() => { count++ });
      
        // Build the new URL with updated query parameters
        const newUrl = count == 0 ? 
            window.location.pathname :
            `${window.location.pathname}?${queryParams.toString()}`;
      
        // Update the browser history without refreshing the page
        history.pushState({}, '', newUrl);
    },

    /**
     * Get object properties from query params if available.
     * 
     * @param object 
     * @returns 
     */
    loadFromQuery(object: any) : any {
        const params = this.queryParams();
        Object.keys(object).forEach((k: string) => {
            if (params[k]) {
                object[k] = params[k];
            }
        });
        return object;
    },

    /**
     * Get item from array using a dot notation
     * string.
     * 
     * @param array arr 
     * @param string key 
     * @returns {*} value
     */
    dotNotation(arr: any, key: string, defaultValue?: string|null) : any {
        if(!arr || !key) {
            return defaultValue !== undefined ? defaultValue : key;
        }

        if (!key.includes(".")) {
            if (arr[key]) return arr[key];
            return defaultValue === undefined  ? key : defaultValue;
        }
        const parts = key.split(".");
        let c = arr;
        for(let i = 0; i<parts.length - 1; ++i) {
            if (!c[parts[i]]) return defaultValue === undefined  ? key : defaultValue;
            c = c[parts[i]];
        }
        const n = parts.length - 1;
        if (!c[parts[n]]) return defaultValue === undefined  ? key : defaultValue;
        return c[parts[n]];
    },

    /**
     * Reverts an array
     * 
     * @param array arr 
     * @returns array
     */
    invertList(arr: any[]) : any[] {
        const inv: any[] = [];

        for(let i = arr.length - 1; i >= 0; --i) {
            inv.push(arr[i]);
        }

        return inv;
    },

    /**
     * Compare two objects recursively.
     * 
     * @param a
     * @param b 
     */
     areEqual(a: any, b: any) : boolean {

        if (a === b) return true;
        if (typeof a != typeof b) return false;

        if (Array.isArray(a)) {
            if (!Array.isArray(b)) return false;
            if (a.length != b.length) return false;
            const checkAllItemsInside = (a: any[], b: any[]) => {
                for(let i = 0; i < a.length; ++i) {
                    const ia = a[i];
                    const ib = b[i];
                    if (!this.areEqual(ia, ib)) return false;
                }
                return true;
            }
            return checkAllItemsInside(a, b);
        }

        if (typeof a == 'object') {
            if (typeof b != 'object') return false;

            const ka = Object.keys(a);
            const kb = Object.keys(b);
    
            if (ka.length != kb.length) return false;
    
            let equal = true;
            ka.forEach((k: string) => {
                if (!equal) return;

                const ia = a[k];
                const ib = b[k];
                equal = this.areEqual(ia, ib);
            });

            return equal;
        }

        return a == b;

    },

    /**
     * Generates a duplicate of an object
     * 
     * @param obj Object
     * @returns Object
     */
     copy(obj: any, options?: {
        copyArrays?: boolean,
        recursive?: boolean
     }, tree: any[] = []) : any {

        if (typeof obj == 'object' && obj.makeCopy && typeof obj.makeCopy == 'function') {
            return obj.makeCopy(new obj.constructor());
        }

        const arrays = options && options.copyArrays === false ? false : true;
        const recursive = options && options.recursive === false ? false : true;

        const s: any = {};
        if (!obj) return s;
        Object.keys(obj)
        .forEach((key: string) => {

            if (obj[key] === null || obj[key] === undefined) {
                s[key] = obj[key];
                return;
            }

            if (Array.isArray(obj[key])) {
                if (arrays)
                    s[key] = this.copyArray(obj[key]);
                else
                    s[key] = obj[key];
            }
            else if (typeof obj[key] == 'object') {

                if (recursive) {

                    if (obj[key].makeCopy && typeof obj[key].makeCopy == 'function') {
                        s[key] = obj[key].makeCopy(new obj[key].constructor());
                    } else {
                        s[key] = this.copy(obj[key], options, tree);
                    }

                } else {
                    s[key] = obj[key];
                }
            } else {
                s[key] = obj[key];
            }
        });
        return s;
    },

    /**
     * Copy an array
     * 
     * @param arr 
     */
    copyArray(arr: any[], options?: {
        copyObjects: boolean,
        copyArrays: boolean
    }, tree: any[] = []) {
        const newarr : any[] = [];

        const arrays = options && options.copyArrays === false ? false : true;
        const objects = options && options.copyObjects === false ? false : true;

        const copyIfArray = (item: any[]) => {
            newarr.push(
                arrays ? 
                this.copyArray(item, options, tree)
                : item
            );
        }

        const copyIfObject = (item: any) => {
            if (!objects) {
                newarr.push(item);
            } else {

                if (item.copy && typeof item.copy == 'function') {
                    newarr.push(item.copy());
                }
                else {
                    newarr.push(this.copy(item, {
                        recursive: true,
                        copyArrays: arrays
                    }));
                }

            }
        }

        for(const item of arr) {

            if (Array.isArray(item)) copyIfArray(item);
            else if (typeof item == 'object') copyIfObject(item);
            else newarr.push(item);

        }

        return newarr;
    },

    /**
     * Validates email format
     * 
     * @param email 
     * @returns bool
     */
    validateEmail(email: string) : boolean {
        if (!email) return false;
        if (email == "") return false;
        if (email.length < 4) return false;

        const c1 = email.indexOf("@");
        const c2 = email.lastIndexOf(".");
        if (c1 < 0) return false;
        if (c2 < 0) return false;
        if (c2 < c1) return false;

        const parts1 = email.split('@');
        const parts2 = parts1[1].split('.');
        
        if (parts1[0] == '') return false;
        if (parts2[0] == '') return false;
        if (parts2[1] == '') return false;

        return true;
    },

    /**
     * Appends items to list
     * 
     * @param array list 
     * @param array items
     * 
     * @returns array
     */
    addToList(list: any[]|null|undefined, items: any[], mapFunc?: (item: any) => any) {
        let l = list;
        if (!l) l = items;
        else {
            for(const n of items) {
                if (mapFunc) {
                    l.push(mapFunc(n));
                } else {
                    l.push(n);
                }
            }
        }
        return l;
    },

    /**
     * Generate a random string
     * 
     * @param int length 
     * @returns 
     */
    randomString(length = 10) {
        let result           = '';
        const characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        const charactersLength = characters.length;
        for (let i = 0; i < length; i++ ) {
            result += characters.charAt(Math.floor(Math.random() * 
            charactersLength));
        }
        return result;
    },

    /**
     * Generate a random number.
     * 
     * @param max 
     */
    rand(max: number = 100) {
        return Math.random() * max;
    },

    /**
     * Force an object to adapt the structure of another with default values.
     * 
     * @param obj 
     * @param defaultValues 
     * @returns object
     */
    force(obj: any, defaultValues: any) {

        const res : any = {};

        Object.keys(defaultValues).forEach((k: string) => {
            res[k] = obj[k] !== undefined ? obj[k] : defaultValues[k];
        });

        return res;

    },

    /**
     * Merge two objects recursively.
     * 
     * @param objA 
     * @param objB 
     */
    merge(objA: any, objB: any, mergeArrays = false) {

        const aux : any = {};
        const hasKey = (obj: any, key: string) => obj[key] !== undefined;
        const use = (key: string, value: any) => { aux[key] = value };
        const isArray = (obj: any, key: string) => Array.isArray(obj[key]);

        const _mergeArrays = (a: any[], b: any[]) => {
            const list : any[] = [];
            for(const item of a) {
                list.push(item);
            } 
            for(const item of b) {
                if (!list.includes(item))
                    list.push(item);
            }
            return list;
        }

        Object.keys(objA).forEach(key => {

            if (Array.isArray(objA[key])) {

                if (!hasKey(objB, key)) 
                    use(key, objA[key]);

                else if (isArray(objB, key) && mergeArrays)
                    use(key, _mergeArrays(objA[key], objB[key]));

                else use(key, objB[key]);

            } 
            else if (typeof objA[key] == 'object') {

                if (!hasKey(objB, key))
                    use(key, objA[key]);

                else if (typeof objB[key] == 'object')
                    use(key, this.merge(objA[key], objB[key]));
                
                else use(key, objB[key]);

            } 
            else {

                if (hasKey(objB, key))
                    use(key, objB[key]);
                else
                    use(key, objA[key]);
            }

        });

        Object.keys(objB).forEach(key => !hasKey(aux, key) ? use(key, objB[key]) : null);

        return aux;

    },

    /**
     * Detect if the bottom has been reached.
     * 
     * @param e Scroll event
     */
    scrollBottomReached(e: any, threshold : number = 50) {

        const top = e.target.scrollTop;
        const height = e.target.clientHeight;
        const scrollHeight = e.target.scrollHeight;
        const umbral = threshold ? threshold : 50;

        if (top + height >= scrollHeight - umbral) {

            return true;

        }

        return false;

    },

    /**
     * Convert a file from an input in a src for an img tag.
     * 
     * @param file
     */
    fileToSrc(file: any) : Promise<any> {

        return new Promise((resolve, reject) => {

            const reader = new FileReader();
        
            reader.onloadend = function () {
                resolve(reader.result);
            }

            reader.onerror = function() {
                reject();
            }
            
            reader.readAsDataURL(file);

        });
    
    },

    fileExists(path: string) : boolean {
        try {
          const xhr = new XMLHttpRequest();
          xhr.open('HEAD', path, false);
          xhr.send();
    
          if (xhr.status == 404)
            return false;
          return true;
        } catch(e) {
          return false;
        }
    },

    fetchFileContent(path: string) : Promise<Blob> {
        return new Promise((resolve, reject) => {
            fetch(path)
            .then(r => r.blob())
            .then((blob: Blob) => {
                resolve(blob);
            })
            .catch(reject);
        })
    },

    fetchFile(path: string, fileName: string = 'file') : Promise<File> {
        return new Promise((resolve, reject) => {
            fetch(path)
            .then(r => r.blob())
            .then((blob: Blob) => {

                const format = blob.type;
                const mimes = this.getMIMETypes();

                let extension = '.txt';
                const keys = Object.keys(mimes);
                for(const k of keys) {
                    if (mimes[k] == format) {
                        extension = '.' + k;
                        break;
                    }
                }

                const file = new File([blob], fileName + extension);
                resolve(file);
            })
            .catch(reject);
        })
    },

    fileToURL(file: File) : string {
        return URL.createObjectURL(file);
    },

    /**
     * 
     * Convert base64 image to blob/file to be uploaded.
     * 
     * @param src Base 64
     * @returns file
     */
    base64ToFile(src: string, name: string = 'file') : File {
        // convert base64/URLEncoded data component to raw binary data held in a string
        let byteString;
        const split = src.split(',');
        if (split[0].indexOf('base64') >= 0)
            byteString = window.atob(split[1]);
        else
            byteString = unescape(split[1]);
        // separate out the mime component
        const mimeString = split[0].split(':')[1].split(';')[0];
        // write the bytes of the string to a typed array
        const ia = new Uint8Array(byteString.length);
        for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
        }
        const blob = new Blob([ia], {type: mimeString});

        let n = name + '';
        if (n == 'file') {
            if (['image/png'].includes(mimeString)) {
                n += '.png';
            }
            else if (['image/jpg', 'image/jpeg'].includes(mimeString)) {
                n += '.jpg';
            }
            else if (['image/gif'].includes(mimeString)) {
                n += '.gif';
            }
            else if (['video/mp4'].includes(mimeString)) {
                n += '.mp4';
            }
            else if (['application/pdf'].includes(mimeString)) {
                n += '.pdf';
            }
            else if (['text/plain'].includes(mimeString)) {
                n += '.txt';
            }
        }

        return new File([blob], n, {type: mimeString});
    },

    base64ToBlob(src: string): Blob {
        const binaryData = atob(src);
        const arrayBuffer = new ArrayBuffer(binaryData.length);
        const uint8Array = new Uint8Array(arrayBuffer);
        for (let i = 0; i < binaryData.length; i++) {
            uint8Array[i] = binaryData.charCodeAt(i);
        }
    
        return new Blob([uint8Array], {type: 'application/pdf'});
    },

    /**
     * Convert the first letter to uppercase
     * 
     * @param text 
     * @returns string
     */
    capitalize(text: string) : string {
        return text[0].toUpperCase() + text.substr(1);
    },

    /**
     * Generate a URL to a random image
     * 
     * @param width 
     * @param height 
     * @returns URL
     */
    randomImage(width = 250, height = 250, seed?: string) : string {
        return 'https://picsum.photos/seed/' + (seed ? seed : this.randomString(4)) + '/' + width + '/' + height;
    },
    
    /**
     * Check if filename has any of these extensions
     * 
     * @param filename 
     * @param extensions 
     * @returns boolean
     */
    hasExtension(filename: string|File, extensions: string|string[]) : boolean {

        const name : string = typeof filename == 'string' ? filename : filename.name;

        const list = Array.isArray(extensions) ? extensions : [extensions];

        for(const s of list) {
            if (name.includes('.' + s)) {
                return true;
            }
        }

        return false;
    },

    /**
     * Format number as text
     * 
     * @param num 
     * @returns 
     */
    formatNumber(num: any, decimals: number = 2) : string {
        if (!num) return '0';

        let n = num;
        if (typeof n == 'number') {
            if (decimals > 0) {
                n = n.toFixed(decimals);
            } else {
                n = "" + Math.floor(n);
            }
        }
        n = n.replace('.', ',');

        if (n.includes(',')) {
            return n.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
        }

        const [ent, dec] = n.split(',');
        return ent.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.') + ',' + dec;
    },

    /**
     * Get object of {extension: mime}
     * 
     * @returns 
     */
    getMIMETypes() : any {
        return {
          'txt': 'text/plain',
          'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'doc': 'application/msword',
          'pdf': 'application/pdf',
          'jpg': 'image/jpeg',
          'jpeg': 'image/jpeg',
          'bmp': 'image/bmp',
          'png': 'image/png',
          'gif': 'image/gif',
          'xls': 'application/vnd.ms-excel',
          'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'rtf': 'application/rtf',
          'ppt': 'application/vnd.ms-powerpoint',
          'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          'zip': 'application/zip',
          'mp3': 'audio/mp3',
          'mpeg': 'video/mpeg',
          'mp4': 'video/mp4'
        }
    },

    getTypeFromMIME(mime: string) {
        const mimes : any = {
            'text/plain': 'txt',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
            'application/msword': 'doc',
            'application/pdf': 'pdf',
            'image/jpeg': 'jpg',
            'image/jpg': 'jpg',
            'image/bmp': 'bmp',
            'image/png': 'png',
            'image/gif': 'gif',
            'application/vnd.ms-excel': 'xls',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
            'application/rtf': 'rtf',
            'application/vnd.ms-powerpoint': 'ppt',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
            'application/zip': 'zip',
            'audio/mp3': 'mp3',
            'video/mpeg': 'mpeg',
            'video/mp4': 'mp4'
        };
        
        return mimes[mime] ?? mime;
    },

    /**
     * Get mime of extension
     * @param extension 
     * @returns 
     */
    getMimeType(extensionOrFile: string|File) : string {

        let name = '';
        if (typeof extensionOrFile != 'string') {
            name = extensionOrFile.name;
        } else {
            if (!extensionOrFile.includes('.'))
                name = extensionOrFile;
            else {
                const parts = extensionOrFile.split('.');
                name = parts[parts.length - 1];
            }
        }

        const types = this.getMIMETypes();
        if (types[name]) {
            return types[name];
        }
        return 'text/plain';
    },

    /**
     * Check whether this file is an image.
     * 
     * @param file
     * @returns 
     */
    isImage(file: File) : boolean {
        const mime = this.getMimeType(file);
        return mime.includes('image/');
    },

    /**
     * Convert HTML text to plain text
     * 
     * @param htmlText 
     * @returns string
     */
    html2Text(htmlText: string) : string {
        const e = document.createElement('div');
        e.innerHTML = htmlText;
        htmlText = htmlText.replace(/<\/p>/gi, '\n').replace(/<br\s*\/?>/gi, '\n');
        e.innerHTML = htmlText;
        const str = e.textContent || '';
        if (str == "\n") return '';
        return str;
    },

    /**
     * Download file
     * 
     * @param file
     */
    downloadFile(file: File) {
        const a = document.createElement('a');
        document.body.appendChild(a);
        const url = window.URL.createObjectURL(file);
        a.href = url;
        a.download = file.name;
        a.click();
        setTimeout(() => {
            window.URL.revokeObjectURL(url);
            a.remove();
        }, 0)
    },

    /**
     * Download blob
     * 
     * @param blob 
     * @param name 
     */
    downloadBlob(blob: Blob, name: string) {
        this.downloadFile(new File([blob], name));
    },

    /**
     * Copy text to clipboard
     * 
     * @param text 
     */
    clipboard(text: string) {
        return new Promise((resolve, reject) => {

            if (typeof navigator !== "undefined" 
            && typeof navigator.clipboard !== "undefined" 
            && navigator.permissions) {

                const type = "text/plain";
                const blob = new Blob([text], { type });
                const data = [new ClipboardItem({ [type]: blob })];

                navigator.permissions.query({name: "clipboard-write" as PermissionName})
                .then(permission => {

                    if (permission.state === "granted" || permission.state === "prompt") {
                        navigator.clipboard.write(data).then(resolve, reject).catch(reject);
                    }
                    else {
                        reject(new Error("Permission not granted!"));
                    }
                });
            }
            else if (document.queryCommandSupported && document.queryCommandSupported("copy")) {
                const textarea = document.createElement("textarea");
                textarea.textContent = text;
                textarea.style.position = "fixed";
                textarea.style.width = '2em';
                textarea.style.height = '2em';
                textarea.style.padding = '0px';
                textarea.style.border = 'none';
                textarea.style.outline = 'none';
                textarea.style.boxShadow = 'none';
                textarea.style.background = 'transparent';
                document.body.appendChild(textarea);
                textarea.focus();
                textarea.select();

                try {
                    document.execCommand("copy");
                    document.body.removeChild(textarea);
                    resolve(true);
                }
                catch (e) {
                    document.body.removeChild(textarea);
                    reject(e);
                }
            }
            else {
                reject(new Error("None of copying methods are supported by this browser!"));
            }
        });
    },

    /**
     * Download text as a file
     * 
     * @param text 
     * @param filename 
     */
    downloadText(text: string, filename: string) {
        // Create a Blob object from the text
        const blob = new Blob([text], { type: 'text/plain' });
      
        // Create a URL for the Blob
        const url = URL.createObjectURL(blob);
      
        // Create a link element with the URL as href and download attribute
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
      
        // Append the link to the document body and click it programmatically
        document.body.appendChild(link);
        link.click();
      
        // Remove the link from the document body
        document.body.removeChild(link);
      
        // Release the URL object
        URL.revokeObjectURL(url);
    },

    /**
     * Separate words in a string
     * 
     * @param text 
     * @returns 
     */
    separateWords(text: string) : string[] {
        const words: string[] = [];

        let currentWord: string = '';

        for(let i = 0; i < text.length; ++i) {
            const c = text[i];

            if (
                // if not . or ,
                !Validator.for(c)
                .isSpecialChars()
                .validate()

                // And
                && (
                    
                    // It's a letter
                    Validator.for(c)
                    .isLetters().validate()
                    ||
                    // Or a number
                    Validator.for(c)
                        .isNumber().validate()
                    
                )
            ) {
                currentWord += c;
            } else {

                if (currentWord != '') {
                    words.push(currentWord);
                }

                currentWord = '';
            }
        }

        return words;
    },

    /**
     * Change CSS variable programmatically.
     * 
     * @param name 
     * @param value
     */
    cssVariable(name: string, value?: string) : string {
        if (!document) return '';
        const root = document.querySelector(':root');
        if (!root) return '';
        if (value) {
            (root as any).style.setProperty('--' + name, value);
            return value;
        }
        else {
            return getComputedStyle(root).getPropertyValue('--' + name)
        }
    },

    /**
     * Replace variables in a string placed with {{ name }}
     * 
     * @param text 
     * @param callback 
     */
    replaceVariables(text: string, callback: (key: string) => string) : string {
        return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
            const value = callback(key.trim());
            return value !== undefined ? value : match;
        });
    },

    normalize(text: string, replace?: any) : string {
        let str = text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        if (replace) {
            Object.keys(replace).forEach((k: string) => {
                str = str.replace(k, replace[k]);
            });
        }
        return str;
    },

    consecutivePromise(list: any[], action: ((item: any) => Promise<any>), index: number = 0) : Promise<any[]> {
        return new Promise((resolve, reject) => {

            if (index >= list.length) {
                resolve([]);
                return;
            }

            action(list[index])
            .then(res => {

                this.consecutivePromise(list, action, index + 1)
                .then(list => {
                    list.unshift(res);
                    resolve(list);
                })
                .catch(reject)
            })
            .catch(err => {
                reject({
                    error: err,
                    index: index
                });
            });

        });
    },

    /**
     * Read the contents of a file
     * 
     * @param file 
     */
    readFileContents(file: File) : Promise<string> {
        return new Promise(resolve => {
            const reader = new FileReader();

            reader.onload = function (e: any) {
                // The file's contents are available in e.target.result
                const fileContents = e.target.result;
                resolve(fileContents);
            };
        
            reader.readAsText(file);
        });
    },

    removeUndefined(obj: any) : any {
        return Object.keys(obj).reduce((acc: any, key) => {
            if (obj[key] !== undefined) {
                acc[key] = obj[key];
            }
            return acc;
        }, {});
    },

    onPressKey(e: any, options?: {
        enter?: () => void,
        escape?: () => void,
        tab?: () => void
    }) {

        if (options && options.enter && e.keyCode == 13) {
            options.enter();
        }
        else if (options && options.escape && e.keyCode == 27) {
            options.escape();
        }
        else if (options && options.tab && e.keyCode == 9) {
            options.tab();
        }
    },

    onStop(key: string = 'write', time: number = 300) {
        return new Promise(resolve => {
            const evs = (window as any)['_stopEvents'] ?? {};
            const ev = evs[key] ?? {
                counter: 0
            };

            const current = ev.counter + 1;
            ev.counter = current;
            evs[key] = ev;
            (window as any)['_stopEvents'] = evs;
            setTimeout(() => {
                if (current == ev.counter) {
                    resolve(key);
                    delete evs[key];
                }
            }, time);
        })
    },

    /**
     * Replace a property in an object with its sub-properties if it's an object too.
     * 
     * @param obj 
     * @param prop 
     */
    extractProps(obj: any, prop: string) {
        if (!obj[prop]) return obj;

        const value = obj[prop];
        delete obj[prop];

        if (typeof value != 'object') {
            return;
        }

        Object.keys(value).forEach(key => {
            obj[key] = value[key];
        });

        return obj;
    },

        /**
     * Get image size
     * 
     * @param src 
     */
    getImageSize(src: string) : Promise<{ width: number, height: number }> {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.src = src;
            img.onload = () => {
                resolve({
                    width: img.width,
                    height: img.height
                });
            }
            img.onerror = () => {
                reject();
            }
        });
    },

    /**
     * Caps an image to a maximum width and height
     * @param file The image file
     * @param maxWidth The maximum width
     * @param maxHeight The maximum height
     * @returns A promise that resolves to a blob
     */
    capImageSize(file: File, maxWidth: number, maxHeight: number): Promise<File> {
        return new Promise((resolve, reject) => {
            const img = new Image();
            const reader = new FileReader();
        
            reader.onload = e => {
              if (!e.target?.result) return reject("Failed to read file");
              img.src = e.target.result as string;
            };
        
            img.onload = () => {
              let { width, height } = img;
              const scale = Math.min(maxWidth / width, maxHeight / height, 1);
              width *= scale;
              height *= scale;
        
              const canvas = document.createElement("canvas");
              canvas.width = width;
              canvas.height = height;
        
              const ctx = canvas.getContext("2d");
              if (!ctx) return reject("Canvas not supported");
        
              ctx.drawImage(img, 0, 0, width, height);
              canvas.toBlob(blob => {
                if (!blob) return reject("Failed to create blob");
                const resizedFile = new File([blob], file.name, { type: file.type });
                resolve(resizedFile);
              }, file.type);
            };
        
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }
      
}
export default utils;
export type {
    UtilsType
}