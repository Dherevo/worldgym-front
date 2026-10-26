// increment-version.js
const fs = require('fs');
const path = require('path');

// Path to package.json
const packageJsonPath = path.join(__dirname, '/../../package.json');

// Read the package.json file
const content = fs.readFileSync(packageJsonPath, 'utf8');

// Parse the package.json content
const packageJson = JSON.parse(content);

if (!packageJson || !packageJson.version) {
    console.error('Error reading package.json');
    process.exit(1);
}

// Get the current version and split it into an array [x, y, z]
const versionParts = packageJson.version.split('.').map(Number);

if (versionParts.length !== 3) {
    console.error('Invalid version format in package.json.');
    process.exit(1);
}

// Increment the patch version (z)
versionParts[2] += 1;

// Join the version parts back together
const newVersion = versionParts.join('.');
//console.log("Version updated to " + newVersion + "\n");

// Update the version in the package.json object
packageJson.version = newVersion;

// Write the updated package.json back to the file
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n', 'utf8');
console.log(`Version updated to ${newVersion}`);