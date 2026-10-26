if(process.argv.length < 3) {
    console.log("Command not specified");
    process.exit(0);
}

const command = process.argv[2];

if (command == 'make:component') {
    require('./make_component');
    process.exit(0);
}

if (command == 'make:simple') {
    require('./make_simple');
    process.exit(0);
}

if (command == 'make:page') {
    require('./make_page');
    process.exit(0);
}

if (command == 'make:layout') {
    require('./make_layout');
    process.exit(0);
}

if (command == 'svg:pack') {
    require('./svg_pack');
    process.exit(0);
}

if (command == 'version:add') {
    require('./increment_version');
    process.exit(0);
}

console.log("Command '" + command + "' not recognized.");