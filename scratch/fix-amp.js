const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'lib', 'blog-templates.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Replace the incorrect escape mapping
// The file has: '&': '&'  (ampersand mapped to itself)
// We need:     '&': '&'  (ampersand mapped to HTML entity)
const oldStr = "'&': '&'";
const newStr = "'&': '" + '&' + 'amp;' + "'";
content = content.replace(oldStr, newStr);

fs.writeFileSync(filePath, content);
console.log('Fixed!');
