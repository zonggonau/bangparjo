const fs = require('fs'); 
let content = fs.readFileSync('src/lib/blog-templates.ts', 'utf8'); 
let lines = content.split('\n'); 
