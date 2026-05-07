const pug = require('pug');
const fs = require('fs');

const html = pug.renderFile('./templates/index.pug');
fs.mkdirSync('public')
fs.writeFileSync('./public/index.html', html, {});