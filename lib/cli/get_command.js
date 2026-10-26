const commands = [];
const options = {};

for(let i = 3; i < process.argv.length; ++i) {

    const a = process.argv[i];

    if (a.length < 1 || a.substring(0, 1) != '@') {
        commands.push(a);
    } else {
        let key = a.substring(1);
        let v = true;
        if (key.includes('=')) {
            const parts = key.split('=');
            key = parts[0];
            v = parts[1];
        }

        options[key] = v;
    }

}

module.exports = {
    commands,
    options
}