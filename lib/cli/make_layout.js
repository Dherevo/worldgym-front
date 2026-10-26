const fs = require('fs');
const { dirname, resolve, basename } = require('path');

const ARGS = require('./get_command');

if (ARGS.commands.length < 1) {
    console.log("Layout name not specified.");
    process.exit(1);
}

let name = ARGS.commands[0];
let route = '';

const src = resolve(dirname('./') + '/src');

let folder = src + "/layouts";

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
    console.log("Layout already exists.");
    process.exit(1);
}

// Create vue file
fs.writeFileSync(folder + `/${name}.vue`, `<template>
    <div id="${name}-layout">
        <slot />
    </div>
</template>

<script lang="ts" src="./${name}.ts"></script>
<style lang="scss" src="./${name}.scss"></style>`);

// SCSS file
fs.writeFileSync(folder + `/${name}.scss`, `#${name}-layout {

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

if (format == 'options') {
    fs.writeFileSync(folder + `/${name}.ts`, `import { defineComponent } from "vue";

export defineComponent({

});`);
}

else if (format == 'composition') {
    fs.writeFileSync(folder + `/${name}.ts`, `import { defineComponent } from '@vue/composition-api'

export default defineComponent({
    setup() {
        return {
            
        }
    },
});`);
}

else {
    fs.writeFileSync(folder + `/${name}.ts`, `import { Component, Vue, toNative, Prop } from "vue-facing-decorator";

@Component({})
class ${upperName}Layout extends Vue {

    @Prop
    page?: () => any

}
export default toNative(${upperName}Layout);`);
}