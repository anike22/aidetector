const fs = require('fs');
const file = '/workspace/app-c18l1vf2nz7l/src/pages/humanizer/HumanizerPage.tsx';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(/chunk\.split\(\'\\\\n\'\)/g, "chunk.split('\\n')");
fs.writeFileSync(file, content);
console.log('Fixed');
