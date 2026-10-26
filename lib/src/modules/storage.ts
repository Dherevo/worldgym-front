
export default class StorageClass {

    set (key: string, value: any) {

        if (typeof value === 'string')
            window.localStorage.setItem(key, value);
        else if (typeof value == 'object' || Array.isArray(value)) {
            window.localStorage.setItem(key, JSON.stringify(value));
        } else {
            window.localStorage.setItem(key, "" + value);
        }

    }

    get (key: string, defaultValue: any = undefined) {

        const value = window.localStorage.getItem(key);
        if (value === null || value === undefined) return defaultValue;

        try {
            const val = JSON.parse(value);
            return val;
        } catch (e) {
            return value;
        }

    }

    remove (key: string) {
        window.localStorage.removeItem(key);
    }

    clear () {
        window.localStorage.clear();
    }

}

const Storage = new StorageClass();
export {
    Storage
}