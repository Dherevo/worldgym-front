import PackageState from "./PackageState";

export default class StoreClass {
    
    private createStore() {
        const obj = {
            getters: {}
        }
        PackageState.set('store', obj);
        return obj;
    }

    public getter(key: string, loader?: () => Promise<any>) {

        let store : any = PackageState.get('store');
        if (!store) {
            store = this.createStore();
        }

        if (!store.getters[key]) {
            store.getters[key] = {
                value: undefined,
                loader,
                listeners: [],
                errorListeners: [],
                status: 'none'
            }
        }
        else {
            store.getters[key].loader = loader;

            if (store.getters[key].listeners.length > 0) {
                this.get(key);
            }
        }

    }

    public has(key: string) : boolean {
        const store : any = PackageState.get('store');
        if (!store) return false;
        return store.getters[key] ? true : false;
    }

    public clear(key:string) {

        const store : any = PackageState.get('store');
        if (!store) return;

        if (store.getters[key]) {
            store.getters[key].value = undefined;
            store.getters[key].status = 'none';
        }
    }

    public clearAll() {
        const store : any = PackageState.get('store');
        if (!store) return;

        Object.keys(store.getters)
        .forEach((k: string) => {
            this.clear(k);
        });
    }

    public reload(key: string) {
        this.clear(key);
        return this.get(key);
    }

    public set(key: string, value: any) {
        const store : any = PackageState.get('store');

        if (store.getters[key]) {
            store.getters[key].value = value;
            return;
        }

        store.getters[key] = {
            value,
            loader: undefined,
            listeners: [],
            errorListeners: [],
            status: 'none'
        };
    }

    public getSync(key: string, defaultValue: any = undefined) {

        const store : any = PackageState.get('store');
        if (!store) return defaultValue;

        if (!store.getters[key]) {
            return defaultValue;
        }

        return store.getters[key].value;
    }

    public get(key:string, loader?: () => Promise<any>) {
        return new Promise((resolve, reject) => {

            let store : any = PackageState.get('store');
            if (!store) {
                store = this.createStore();
            }

            if (!store.getters[key]) {
                this.getter(key, loader);
            }
            else if (loader) {
                store.getters[key].loader = loader;
            }
    
            const g = store.getters[key];

            if (g.value === undefined) {

                if ((g.status == 'none' && !g.loader) || g.status == 'loading') {
                    g.listeners.push(resolve);
                } else if (g.loader) {

                    g.status = 'loading';

                    g.loader()
                    .then((value: any) => {

                        g.status = 'loaded';
                        g.value = value;

                        g.listeners.push(resolve);
                        for(const r of g.listeners)
                            r(g.value);
                        g.listeners = [];

                    })
                    .catch(() => {
                        g.status = 'none';
                        g.value = undefined;

                        g.errorListeners.push(reject);
                        for(const r of g.errorListeners)
                            r();
                        g.errorListeners = [];
                    });

                }

            } else {

                g.listeners.push(resolve);

                for(const r of g.listeners)
                    r(g.value);
                
                g.listeners = [];

            }

        });
    }

}

const Store : StoreClass = new StoreClass();
export {
    Store
}