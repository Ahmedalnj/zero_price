const fs = require('fs');

const htmlPath = 'c:/Users/Ahmed/Desktop/pricin/index.html';
const cssPath = 'c:/Users/Ahmed/Desktop/pricin/index.css';

let html = fs.readFileSync(htmlPath, 'utf8');

const styleStart = html.indexOf('<style>');
const styleEnd = html.indexOf('</style>') + '</style>'.length;

if (styleStart !== -1 && styleEnd > styleStart) {
    const styleContent = html.substring(styleStart + 7, html.indexOf('</style>'));
    const newCss = `@import "tailwindcss";\n` + styleContent;
    fs.writeFileSync(cssPath, newCss);

    const newHtml = html.substring(0, styleStart) + '<link rel="stylesheet" href="/index.css">' + html.substring(styleEnd);
    fs.writeFileSync(htmlPath, newHtml);
    console.log('Success!');
} else {
    console.log('Style tag not found');
}
