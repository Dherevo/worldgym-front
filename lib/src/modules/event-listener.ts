import PackageState from "./PackageState";

export default class EventListener {

    //static events : any = {}

    private static createEvents() {
        const events = {}
        PackageState.set('events', events)
        return events;
    }

    static on(event: string, action: string, callback: (param?: any) => void) {

        let events = PackageState.get('events');
        if (!events) {
            events = this.createEvents();
        }

        if (!events[event]) {
            events[event] = {}
        }

        let ac = action;
        if (ac == '*') {
            ac = "" + Math.random() * 1000;
            while(events[event][ac]) {
                ac = "" + Math.random() * 1000;
            }
        }

        events[event][ac] = callback;
    }

    static trigger(event: string, param?: any) : Promise<any[]> {

        return new Promise(resolve => {

            const events = PackageState.get('events');

            if (!events || !events[event]) {
                resolve([]);
                return;
            }
    
            this._trigger(event, Object.keys(events[event]), param)
            .then((returns: any) => {
                resolve(returns);
            });

        });

    }

    private static _trigger(event: string, keys: string[], param: any, returns: any[] = []) : Promise<any[]> {
        
        return new Promise(resolve => {

            if (keys.length == 0) {
                resolve(returns);
                return;
            }

            const key = keys[0];

            const events = PackageState.get('events');

            const func = events[event][key];
            if (!func) {
                resolve(returns);
                return;
            }

            const ret = func(param);

            const recursive = () => {
                keys.splice(0, 1);
                this._trigger(event, keys, param, returns)
                .then(returns => {
                    resolve(returns);
                });
            };

            if (ret instanceof Promise) {
                ret.then(res => {
                    returns.push(res);
                    recursive();
                });
            }
            else {
                returns.push(ret);
                recursive();
            }

        });
    }

    static resetEvent(event: string) {
        const events = PackageState.get('events');
        if (!events) return;
        events[event] = null;
        delete events[event];
    }

    static destroy(event: string, action: string) {
        const events = PackageState.get('events');
        if (!events) return;
        if (!events[event]) return;
        if (!events[event][action]) return;
        events[event][action] = null;
        delete events[event][action];
    }

    static existsEvent(event: string) {
        const events = PackageState.get('events');
        if (!events) return false;
        if (!events[event]) return false;
        return true;
    }

}