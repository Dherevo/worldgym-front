import { Model, http, Time } from "lib";
import Paginated from "./paginated";
import users from '../assets/fakeAPIdata/users.json';

export default class User extends Model {

    id: number = 0;
    name: string = '';
    lastname: string = '';
    email: string = '';
    department: string = '';
    image: string = '';
    date?: Time;
    status: 'active' | 'disabled' | 'waiting' = 'active';

    constructor(api?: any) {
        super();

        this.import(api, {
            date: v => new Time(v)
        });

    }

    get fullName() {
        return this.name + ' ' + this.lastname;
    }

    static list(params: any = {}) : Promise<Paginated<User>> {
        return http.get('/users')
            .data(params)
            .useFake(resolve => {
                const page = params.page ?? 1;
                const items =  users.slice((page - 1) * 10, page * 10);

                resolve({
                    perPage: 10,
                    totalItems: users.length,
                    totalPages: Math.floor(users.length / 10) + 1,
                    items
                })
            })
            .transform(response => {
                return {
                    ...response,
                    items: response.items.map((item: any) => new User(item))
                }
            })
            .promise();
    }

}