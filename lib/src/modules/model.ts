import utils from "./utils";

export default class Model {

    constructor(_apiResponse?: any) {}

    import(api?: any, exceptions?: {[key:string]: (v?:any) => any}) {
        if (!api) return;

        const exc = utils.copy(exceptions);
        const props : any = Object.getOwnPropertyNames(this)

        Object.keys(api)
        .forEach((k: string) => {

            if (!props.includes(k)) {
                delete props[k];
                return;
            }
            delete props[k];

            if (exc && exc[k]) {
                (this as any)[k] = exc[k](api[k]);
                delete exc[k];
                return;
            }

            (this as any)[k] = api[k];
        })

        Object.keys(exc)
        .forEach((k: string) => {
            (this as any)[k] = exc[k](undefined);
        })

    }

    makeCopy() {
        const copy = Object.create(Object.getPrototypeOf(this));
        try {
            Object.assign(copy, structuredClone(this));
        } catch (e) {
            Object.assign(copy, this);
        }
        return copy;
    }

    private _convertExportValue(v: any) {
        if (!v) return v;
        if (Array.isArray(v)) {
            const arr : any[] = [];
            for(const item of v) {
                arr.push(this._convertExportValue(item));
            }
            return arr;
        }
        if (typeof v == 'object' && v['export']) {
            return v.export();
        }
        return v;
    }

    export(exceptions: {[key:string]: (v?:any) => any} = {}, nullTreatment: 'includeNulls'|'ignoreNulls'|'nullsAsEmptyString' = 'includeNulls') {

        const data : any = utils.copy(exceptions);
        const obj : any = {}

        const props = Object.getOwnPropertyNames(this)
        props.forEach((k: string) => {
            if (k.length > 1 && k[0] == '_') return;

            let val : any = (this as any)[k];

            if (data && data[k]) {
                val = exceptions[k]((this as any)[k]);
            }

            if (val === undefined) return;
            if (val === null) {
                if (nullTreatment == 'ignoreNulls') return;
                if (nullTreatment == 'nullsAsEmptyString') val = '';
            }
            val = this._convertExportValue(val);
            obj[k] = val;

            delete data[k];
        });

        Object.keys(data)
        .forEach((k: string) => {
            obj[k] = data[k]();

            if (obj[k] === undefined) {
                delete obj[k];
            }
        });

        return obj;
    }

    isEqualTo(other: Model, debug: boolean = false) {
        const me = (this as any)
        const otherObj = (other as any)

        const keysMe = Object.keys(me);
        const keysOther = Object.keys(other);

        const log = (...args: any[]) => {
            if (debug) {
                console.debug(...args);
            }
        }

        if (keysMe.length != keysOther.length) {
            log("Not equal: keysMe.length != keysOther.length", keysMe, keysOther);
            return false;
        }

        for(const k of keysMe) {
            if (otherObj[k] === undefined) {
                log("Not equal: otherObj[k] === undefined", k, otherObj);
                return false;
            }
        }
        for(const k of keysOther) {
            if (me[k] === undefined) {
                log("Not equal: me[k] === undefined", k, me);
                return false;
            }
        }

        for(const k of keysMe) {
            const valMe = me[k];
            const valOther = otherObj[k];

            if (!utils.areEqual(valMe, valOther)) {
                log("Not equal: utils.areEqual(valMe, valOther)", k, valMe, valOther);
                return false;
            }
        }

        return true;
    }

}