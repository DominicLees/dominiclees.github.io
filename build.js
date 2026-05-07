const pug = require('pug');
const sass = require('sass');
const fs = require('fs');
const path = require('path');

if (!fs.existsSync('public')) fs.mkdirSync('public');

// Compile pug files into html
const pugFiles = fs.readdirSync('./templates', { recursive: true }).filter(file => file.endsWith('.pug'));
pugFiles.forEach(file => {
    const inputPath = path.join('./templates', file);
    const outputPath = path.join('./public', file.replace('.pug', '.html'));

    fs.mkdirSync(path.dirname(outputPath), { recursive: true });

    const html = pug.renderFile(inputPath);
    fs.writeFileSync(outputPath, html);
})

// Compile SCSS files into CSS
const scssFiles = fs.readdirSync('./src/styles', { recursive: true }).filter(file => file.endsWith('.scss'));
scssFiles.forEach(file => {
    const inputPath = path.join('./src/styles', file);
    const outputPath = path.join('./public/styles', file.replace('.scss', '.css'));
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    const css = sass.compile(inputPath, {style: "compressed"}).css;
    fs.writeFileSync(outputPath, css);
})