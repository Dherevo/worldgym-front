# Purpose
Create a model class for project entities which came from API.

# Rules
- Use always a class, not interfaces.
- Class must extend "Model" imported from "lib".
- Class has a constructor which "imports" properties from the passed object with the method import().
- The method import transforms special data types (like dates, objects, etc) using the second parameter of import().
- When creating the code, remove the comments from the following example.
- Adapt the name of the class and URLs to the asked model name.
- When creating a new model add only the requested properties or if not specified, only "id" and "name", nothing else. Additional properties will be requested later.
- Do not invent more than what's specified in this file.

# Example
```ts
import { Model, Time, http } from 'lib'
import Paginated from './paginated'; // src/models/paginated.ts

export default class ModelName from Model {

    id: string = '';
    name: string = '';
    created_at: Time = new Time();
    //... other properties

    constructor(api?: any) {
        super();

        this.import(api, {
            // Properties that must be converted from basic types to custom:
            created_at: v => new Time(v)
        })
    }

    ////// API Calls

    static list(filters?: any) : Paginated<ModelName> {
        return http.get(`/model-names`)
            .data(filters)
            // Transforms the api response to objects of this class
            .transform(response => ({
                ...response,
                items: response.items.map( (item: any) => new ModelName(item) )
            }))
            .promise();
    }

    static get(id: string) : ModelName {
        return http.get(`/model-names/${id}`)
            .transform(response => new ModelName(response))
            .promise();
    }

    save() {

        const data = this.export({
            // Here special data must be converted back to basic types
            created_at: v => this.created_at.datetime(),
            // Undefined values will be removed from the object. We don't want to send the id.
            id: v => undefined
        })

        // If it's new
        if (!this.id) {
            // Create
            return http.post(`/model-names`)
                .data(data)
                .transform(response => {
                    // We store the id so it's not new anymore
                    if (response.id) {
                        this.id = response.id;
                    }
                    return response;
                })
                .promise();
        }
        else {
            return http.put(`/model-names/${this.id}`)
                .promise();
        }

    }

    delete() {
        return http.delete(`/model-names/${this.id}`).promise();
    }

}