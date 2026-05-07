const pug = require('pug');
const sass = require('sass');
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
let articles = [];

// Compile complete pug files into html
async function compilePages() {
    console.log("Starting compiling pages files");
    const pugFiles = fs.readdirSync('./src/pages', { recursive: true }).filter(file => file.endsWith('.pug'));
    pugFiles.forEach(file => {
        const inputPath = path.join('./src/pages', file);
        const outputPath = path.join('./public', file.replace('.pug', '.html'));

        fs.mkdirSync(path.dirname(outputPath), { recursive: true });

        const html = pug.renderFile(inputPath, {articles});
        fs.writeFileSync(outputPath, html);
    })
    console.log("Finished compiling pages files");
}

// Compile blog posts
function compileBlogPosts() {
    console.log("Starting compiling blog posts");
    const postTemplate = pug.compileFile('./src/templates/post.pug');

    // Get all post files in order from newest to oldest
    const postFiles = fs.readdirSync('./posts', { recursive: true })
    .filter(file => file.endsWith('.pug'))
    .sort((a, b) => {
    const timeA = fs.statSync(path.join('./posts', a)).mtimeMs;
    const timeB = fs.statSync(path.join('./posts', b)).mtimeMs;
    return timeB - timeA;
    });

    // Render each post using the blog post template
    postFiles.forEach(file => {
        const inputPath = path.join('./posts', file);
        const newFileName = file.replace('.pug', '.html')
        const outputPath = path.join('./public/post', newFileName);

        fs.mkdirSync(path.dirname(outputPath), { recursive: true });

        const article = pug.renderFile(inputPath);
        const html = postTemplate({article})
        fs.writeFileSync(outputPath, html);
        
        // Cache rendered articles
        if (articles.length >= 10) return;
        articles.push({
            filename: newFileName,
            title: article.split('<h1>').pop().split('</h1>')[0],
            subtitle: article.split('<h2>').pop().split('</h2>')[0]
        })
    })
    console.log("Finished compiling blog posts");
}

// Compile SCSS files into CSS
async function compileCSS() {
    console.log("Starting compiling SCSS files");
    const scssFiles = fs.readdirSync('./src/styles', { recursive: true }).filter(file => file.endsWith('.scss'));
    scssFiles.forEach(file => {
        const inputPath = path.join('./src/styles', file);
        const outputPath = path.join('./public/styles', file.replace('.scss', '.css'));
        fs.mkdirSync(path.dirname(outputPath), { recursive: true });
        const css = sass.compile(inputPath, {style: "compressed"}).css;
        fs.writeFileSync(outputPath, css);
    })
    console.log("Finished compiling SCSS files");
}

// Determine which tasks to perform
let task;
// CSS only
if (args.includes('--css')) {
    task = compileCSS();
// Blog posts only
} else if (args.includes('--posts')) {
    task = compileBlogPosts();
    process.exit();
// Pages only
} else if (args.includes('--pages')) {
    compileBlogPosts();
    task = compilePages();
// Default task
} else {
    task = Promise.all([
        compileBlogPosts(),
        Promise.all([compilePages(), compileCSS()])
    ]);
}

// Perform build task
task.then(() => {
    console.log("All tasks complete");
}).catch(error => {
    console.error(error);
});