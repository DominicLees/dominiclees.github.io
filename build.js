const pug = require('pug');
const fs = require('fs');
const path = require('path');

if (!fs.existsSync('public')) fs.mkdirSync('public');

const files = fs.readdirSync('./templates', { recursive: true }).filter(file => file.endsWith('.pug'));
files.forEach(file => {
    const inputPath = path.join('./templates', file);
    const outputPath = path.join('./public', file.replace('.pug', '.html'));

    fs.mkdirSync(path.dirname(outputPath), { recursive: true });

    const html = pug.renderFile(inputPath);
    fs.writeFileSync(outputPath, html);
})