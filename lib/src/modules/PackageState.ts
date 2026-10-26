
export default {

    set(key: string, value: any) {

        const w = (window as any);

        let obj = w['_project_'];

        if (!obj) {
            obj = {}
            w['_project_'] = obj;
        }

        obj[key] = value;

    },

    get(key: string) : any {
        const w = (window as any);
        const obj = w['_project_'];
        if (!obj) return undefined;
        return obj[key];
    },

    delete(key: string) {
        const w = (window as any);
        const obj = w['_project_'];
        if (!obj) return;
        delete obj[key];
    }

}