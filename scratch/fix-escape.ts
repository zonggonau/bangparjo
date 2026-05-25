import * as fs from 'fs';
const content = fs.readFileSync('src/lib/blog-templates.ts', 'utf8');
const fixed = content.replace(
  `'&': '&'`,
  `'&': '&'`
);
fs.writeFileSync('src/lib/blog-templates.ts', fixed, 'utf8');
console.log('Fixed!');
