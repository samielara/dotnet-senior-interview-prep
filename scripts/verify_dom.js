const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
const appJs = fs.readFileSync('js/app.js', 'utf8');

const regex = /getElementById\(['"]([^'"]+)['"]\)/g;
const ids = new Set();
let match;
while ((match = regex.exec(appJs)) !== null) {
  ids.add(match[1]);
}

console.log('Total unique IDs referenced in app.js:', ids.size);
let missing = 0;
for (const id of ids) {
  if (!html.includes(`id="${id}"`)) {
    console.error(`MISSING ID in index.html: id="${id}"`);
    missing++;
  }
}

if (missing === 0) {
  console.log('SUCCESS: All element IDs referenced in app.js exist in index.html!');
} else {
  console.log(`ERROR: ${missing} missing IDs detected!`);
}
