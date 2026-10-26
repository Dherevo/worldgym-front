if(process.argv.length < 3) {
    console.log("Command not specified");
    process.exit(0);
}

const command = process.argv[2];

if (command == 'make:component') {
    require('./cli/make_component');
    process.exit(0);
}

if (command == 'make:page') {
    require('./cli/make_page');
    process.exit(0);
}

if (command == 'make:layout') {
    require('./cli/make_layout');
    process.exit(0);
}

if (command == 'svg:pack') {
    require('./cli/svg_pack');
    process.exit(0);
}

console.log("Command '" + command + "' not recognized.");