To create a table in the layout just add:

```vue
<AppTable v-if="table" :table="table"/>
<loader v-else />
```

Table columns and behavior is defined in the ts file:

```ts
created() {
    this.initTable();
}

iniTable() {
    this.table = Table.create()
        // Tell the table how to get data from API
        .fetch(resolve => {

            Model.list()
            .then(paginated => {

                this.table.pagination({
                    pageSize: paginated.perPage,
                    totalResults: paginated.totalItems
                });

                resolve(paginated.items);
            })

        })
        // Columns
        .setColumns([
            {
                name: 'name',
                value: item => item.name
            },
            {
                name: 'email',
                value: item => item.email
            }
        ])
}
```

Check /lib/src/widgets/app-table/table.ts for more info about table options.