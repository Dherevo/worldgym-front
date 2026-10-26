const ARGS = require('./get_command');

if (ARGS.commands.length < 1) {
    console.log("SVGs folder not indicated.");
    process.exit(1);
}

if (ARGS.commands.length < 2) {
    console.log("SVG pack output name not indicated.");
    process.exit(1);
}

const fs = require('fs');
const { join, basename, resolve, dirname } = require('path');

const dir = ARGS.commands[0];
const output = ARGS.commands[1];

const src = resolve(dirname('./') + '/src');
const folder = src + (dir[0] == '/' ? dir : '/'+dir);

const outputFile = src + '/public/svg-icons/' + output;

if (!fs.existsSync(folder)) {
    console.log("SVGs folder does not exist: " + folder);
    process.exit(1);
}

console.log("Processing svg files...");

function fromDir(startPath, filter, list = []) {

    if (!fs.existsSync(startPath)) {
        console.log("no dir ", startPath);
        return;
    }

    var files = fs.readdirSync(startPath);
    for (var i = 0; i < files.length; i++) {
        var filename = join(startPath, files[i]);
        var stat = fs.lstatSync(filename);
        if (stat.isDirectory()) {
            fromDir(filename, filter); //recurse
        } else if (filename.endsWith(filter)) {
            list.push(filename);
        };
    };

    return list;
};

const updateProp = (str, prop, value, after = false) => {

    let content = str;
    const index = content.indexOf(prop + '="');
    const firstClosure = content.indexOf('>');
    
    if (firstClosure < index) return content;

    if (index < 0) {
        content = content.replace('viewBox=', prop + '="'+value+'" viewBox=');
    }
    else {
        let start = index + prop.length + 2;
        let end = start;
        while (end < content.length && content[end] != '"') {
            end += 1;
        }

        if (value) {
            const val = content.substring(start, end);
            content = content.replace(`${prop}="${val}"`, `${prop}="${value}"`)
        } else {
            content = content.substring(0, index - 1) + content.substring(end + 1);
        }

    }

    return content;

}

const removeProp = (str, prop) => {

    let content = str + "";

    let index = content.indexOf(`${prop}="`);

    let skipIndex = 0;

    while(index >= 0) {
        let start = index + prop.length + 2;
        let end = start;
        while (end < content.length && content[end] != '"') {
            end += 1;
        }

        const v = content.substring(start, end)

        if (v != 'none') {
            content = content.substring(0, index - 1) + content.substring(end + 1);
        } else {
            skipIndex = end + 1;
        }

        if (skipIndex == 0) {
            index = content.indexOf(`${prop}="`);
        }
        else {
            const sub = content.substring(skipIndex);
            const subindex = sub.indexOf(`${prop}="`);

            if (subindex >= 0) {
                index = skipIndex + subindex
            } else {
                index = -1;
            }
        }
    }

    index = content.indexOf(`${prop}:`);

    skipIndex = 0;

    while(index >= 0) {
        let start = index + prop.length + 1;
        let end = start;
        while (end < content.length && content[end] != ';') {
            end += 1;
        }

        const v = content.substring(start, end)

        if (v != 'none') {
            content = content.substring(0, index) + content.substring(end + 1);
        } else {
            skipIndex = end + 1;
        }

        if (skipIndex == 0) {
            index = content.indexOf(`${prop}:`);
        }
        else {
            const sub = content.substring(skipIndex);
            const subindex = sub.indexOf(`${prop}:`);

            if (subindex >= 0) {
                index = skipIndex + subindex
            } else {
                index = -1;
            }
        }

    }


    return content;

}

let newContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
<defs>

</defs>`;

const files = fromDir(folder, '.svg');
for(let file of files) {
    let content = fs.readFileSync(file).toString();
    let filename = basename(file).replace('.svg', '');
    content = content.replace('<?xml version="1.0" encoding="UTF-8"?>', '');
    content = content.replace('<?xml version="1.0" encoding="utf-8"?>', '');
    content = content.replace('<?xml version="1.0" standalone="no"?>', '');
    content = content.replace('<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">', '');

    content = removeProp(content, 'stroke');
    content = removeProp(content, 'fill');
    content = removeProp(content, 'width');
    content = removeProp(content, 'height');

    content = "\n" + content.replace('<svg', '<symbol');

    content = updateProp(content, 'id', filename);

    const strokeOrFill = ARGS.options.stroke ? 'stroke' : 'fill';
    content = updateProp(content, strokeOrFill, 'currentColor');

    content = content.replace('/svg>', '/symbol>');
    newContent += content;
}

newContent += `\n</svg>`;

console.log("Saved packed .svg file in " + outputFile + '.svg');
fs.writeFileSync(outputFile + '.svg', newContent);