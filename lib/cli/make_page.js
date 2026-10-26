const fs = require('fs');
const { dirname, resolve, basename } = require('path');

const ARGS = require('./get_command');

if (ARGS.commands.length < 1) {
    console.log("Page name not specified.");
    process.exit(1);
}

let name = ARGS.commands[0];
let route = '';

const src = resolve(dirname('./') + '/src');
let folder = src + "/pages";

const parts = name.split('/');
for(const part of parts) {
    folder += '/' + part;
    route += '/' + part;

    if (!fs.existsSync(folder)) {
        fs.mkdirSync(folder, { recursive: true }, (err) => {});
    } else {
        continue;
    }
}

name = basename(folder);

if (fs.existsSync(folder + `/${name}.vue`)) {
    console.log("Page already exists.");
    process.exit(1);
}

///// CREATE VUE FILE /////

let pageContent = '';

// Layout de la página
let layout = 'default';
if (ARGS.options.layout) 
    layout = ARGS.options.layout;
else if (ARGS.options.template == 'table')
    layout = 'backoffice';

// Template
if (!ARGS.options.template) {
    pageContent = `<h1>${name}</h1>`;
}
else if (ARGS.options.template == 'table') {
    pageContent = `<h1>${name}</h1>

            <AppTable :table="table" />`;
}

fs.writeFileSync(folder + `/${name}.vue`, `<template>
    <AppPage layout="${layout}">
        <div id="${name}-page">
            ${pageContent}
        </div>
    </AppPage>
</template>

<script lang="ts" src="./${name}.ts"></script>
<style lang="scss" src="./${name}.scss"></style>`);

// SCSS file
fs.writeFileSync(folder + `/${name}.scss`, `#${name}${(name.includes('-page') ? '' : '-page')} {

}`);

// TS file
let upperName = '';
let nextUpper = true;
for(let i = 0; i < name.length; ++i) {
    if (name[i] == '-') {
        nextUpper = true;
        continue;
    }

    if (nextUpper) {
        upperName += name[i].toUpperCase();
        nextUpper = false;
    } else {
        upperName += name[i];
    }
}

let format = ARGS.options.format;
if (!['class','composition','options']) {
    format = 'class';
}

pageContent = '';

//// OPTIONS API ////
if (format == 'options') {

    pageContent = `
export defineComponent({

});`;

    if (ARGS.options.template == 'table') {
        pageContent = `import { Table, AppTable } from "lib";

export defineComponent({

    components: {
        AppTable
    },

    data() {
        const data : {
            table?: Table;
        } = {
            table: undefined
        };
        return data;
    },

    created() {

        this.table = Table.create()

            // Get data from API
            .fetch(() => new Promise(resolve => {

                // API GET
                API.get('/endpoint')
                .then(response => {

                    this.table!.pagination({
                        perPage: response.perPage,
                        totalResults: response.totalItems
                    });

                    resolve(response.items);
                })

            }))

            // Set table columns
            .setColumns([
                {
                    header: 'ID',
                    name: 'id',
                    width: 50,
                },
                {
                    header: 'Name',
                    name: 'name'
                },
                // ...
            ]);
    }

});`;
    }

    fs.writeFileSync(folder + `/${name}.ts`, `import { defineComponent } from "vue";
${pageContent}`);
}

//// COMPOSITION API ////
else if (format == 'composition') {

    pageContent = `import { Table, AppTable } from "lib";

export default defineComponent({
    
    components: {
        AppTable
    },

    setup() {
        const table = ref<Table | undefined>(undefined);

        onMounted(() => {
            table.value = Table.create()
                // Get data from API
                .fetch(() => new Promise(resolve => {
                    // API GET
                    API.get('/endpoint')
                    .then(response => {
                        table.value!.pagination({
                            perPage: response.perPage,
                            totalResults: response.totalItems
                        });
                        resolve(response.items);
                    });
                }))
                // Set table columns
                .setColumns([
                    {
                        header: 'ID',
                        name: 'id',
                        width: 50,
                    },
                    {
                        header: 'Name',
                        name: 'name'
                    },
                    // ...
                ]);
        });

        return {
            table
        };
    }

});`;

    if (ARGS.options.template == 'table') {
pageContent = `
export default defineComponent({

    setup() {
        return {
            
        }
    },
});`;
    }

    fs.writeFileSync(folder + `/${name}.ts`, `import { defineComponent } from '@vue/composition-api'
${pageContent}`);
}

//// VUE FACING DECORATOR ////
else {

    pageContent = `
@Component({})
class ${upperName}Page extends Vue {


}
export default toNative(${upperName}Page);`;
    
    if (ARGS.options.template == 'table') {
    pageContent = `import { Table, AppTable } from "lib";

@Component({
    components: {
        AppTable
    }
})
class ${upperName}Page extends Vue {

    table?: Table;

    created() {

        this.table = Table.create()

            // Get data from API
            .fetch(() => new Promise(resolve => {

                // API GET
                API.get('/endpoint')
                .then(response => {

                    this.table!.pagination({
                        perPage: response.perPage,
                        totalResults: response.totalItems
                    });

                    resolve(response.items);
                })

            }))

            // Set table columns
            .setColumns([
                {
                    header: 'ID',
                    name: 'id',
                    width: 50,
                },
                {
                    header: 'Name',
                    name: 'name'
                },
                // ...
            ]);
    }
}
export default toNative(${upperName}Page);`;
    }

    fs.writeFileSync(folder + `/${name}.ts`, `import { Component, Vue, toNative } from "vue-facing-decorator";
${pageContent}`);
}


// Add page route
let configFile = src + '/config/routes.ts';

function addRouteToFile (file) {

    let allContents = fs.readFileSync(file).toString();
    let str = '';

    // ADD IMPORT
    let index = allContents.lastIndexOf('IRoutes');

    let openIndex = index;
    while(openIndex > 1 && allContents[openIndex] != ";") {
        openIndex -= 1;
    }

    if (openIndex <= 1) return;
    openIndex += 1;

    str = allContents.substring(0, openIndex);
    str += "\n" + "import "+upperName+"Page from '../pages/"+name+"/"+name+".vue';";
    str += allContents.substring(openIndex);

    allContents = str;

    // ADD ROUTE

    index = allContents.lastIndexOf("[CLI]");
    if (index < 0) {
        return;
    }

    openIndex = index;
    while(openIndex > 1 && allContents[openIndex] != "\n") {
        openIndex -= 1;
    }

    if (openIndex <= 1) return;
    openIndex += 1;

    str = allContents.substring(0, openIndex);
    str += `        {
            path: '${route}',
            component: ${upperName}Page
        },\n`;
    str += allContents.substring(openIndex);
    
    fs.writeFileSync(file, str);
}

if (fs.existsSync(configFile)) {
    addRouteToFile(configFile);
}