const fs = require('fs');
const { dirname, resolve, basename } = require('path');

const ARGS = require('./get_command');

if (ARGS.commands.length < 1) {
    console.log("Component name not specified.");
    process.exit(1);
}

let name = ARGS.commands[0];
let route = '';

const src = resolve(dirname('./') + '/src');

let folder = src;

const parts = name.split('/');
for(let i = 0; i < parts.length - 1; ++i) {
    const part = parts[i];
    folder += '/' + part;
    route += '/' + part;

    if (!fs.existsSync(folder)) {
        fs.mkdirSync(folder, { recursive: true }, (err) => {});
    } else {
        continue;
    }
}
name = parts[parts.length - 1];

if (fs.existsSync(folder + `/${name}.vue`)) {
    console.log("Component already exists.");
    process.exit(1);
}

// Create vue file
fs.writeFileSync(folder + `/${name}.vue`, `<template>
    <div class="${name}">

    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({

    setup: () => ({
        // Add here your methods and variables
    })

});
</script>`);