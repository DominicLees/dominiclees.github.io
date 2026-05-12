const pug = require('pug');
const sass = require('sass');
const XMLParser = require('fast-xml-parser').XMLParser;
const XMLBuilder = require('fast-xml-parser').XMLBuilder;
const { parse } = require('csv-parse/sync');
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const articles = [];

// Compile complete pug files into html
async function compilePages() {
    console.log("Starting compiling pages files");
    const pugFiles = fs.readdirSync('./src/pages', { recursive: true }).filter(file => file.endsWith('.pug'));
    const recentArticles = articles.slice(0, 9);

    pugFiles.forEach(file => {
        const inputPath = path.join('./src/pages', file);
        const outputPath = path.join('./public', file.replace('.pug', '.html'));
        fs.mkdirSync(path.dirname(outputPath), { recursive: true });

        const html = pug.renderFile(inputPath, {articles: recentArticles});
        fs.writeFileSync(outputPath, html);
    })
    console.log("Finished compiling pages files");
}

// Compile blog posts
function compileBlogPosts() {
    console.log('Starting compiling blog posts');
    const postTemplate = pug.compileFile('./src/templates/post.pug');
    fs.mkdirSync('./public/post', { recursive: true });

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
        const newFileName = file.replace('.pug', '.html').split('/').pop();
        const outputPath = path.join('./public/post', newFileName);

        // Get CSV data and set to locals
        const folder = path.join('./posts', path.dirname(file));
        const csvFiles = fs.readdirSync(folder).filter(f => f.endsWith('.csv'));
        const locals = {};
        csvFiles.forEach(csvFile => {
            const data = fs.readFileSync(path.join(folder, csvFile));
            locals[path.basename(csvFile).split('.')[0]] = parse(data, { columns: true, skip_empty_lines: true });
        });
        
        // Render each article in html before passing it to the blog post template
        const article = pug.renderFile(inputPath, locals);
        const html = postTemplate({article})
        fs.writeFileSync(outputPath, html);
        
        // Cache rendered articles
        articles.push({
            filename: newFileName,
            title: article.split('<h1>').pop().split('</h1>')[0],
            subtitle: article.split('<h2>').pop().split('</h2>')[0]
        })
    })
    console.log('Finished compiling blog posts');
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

async function generateRSS() {
    console.log("Starting generating RSS file");
    // Read base xml file
    const baseFile = fs.readFileSync("./src/rss.xml");
    const parser = new XMLParser({ignoreAttributes: false});
    let xml = parser.parse(baseFile);

    // Add articles as items
    xml.rss.channel.item = articles.map(article => {
        return {
            link: `https://dominiclees.github.io/post/${article.filename}`,
            title: article.title,
            description: article.subtitle
        }
    });

    // Write completed file to public folder
    const builder = new XMLBuilder({ignoreAttributes: false, format: true});
    const content = builder.build(xml);
    fs.mkdirSync(path.dirname("./public/feeds/rss.xml"), { recursive: true });
    fs.writeFileSync("./public/feeds/rss.xml", content);
    console.log("Finished generating RSS file");
}

// Determine which tasks to perform
let task;
// CSS only
if (args.includes('--css')) {
    task = compileCSS();
// Blog posts only
} else if (args.includes('--posts')) {
    task = new Promise((resolve, reject) => resolve(compileBlogPosts()));
// Pages only
} else if (args.includes('--pages')) {
    compileBlogPosts();
    task = compilePages();
// Default task
} else {
    task = Promise.all([
        compileBlogPosts(),
        Promise.all([compilePages(), compileCSS(), generateRSS()])
    ]);
}

const startTime = performance.now()
// Perform build task
task.then(() => {
    const endTime = performance.now()
    console.log(`All tasks completed in ${endTime - startTime}ms`);
}).catch(error => {
    console.error(error);
});