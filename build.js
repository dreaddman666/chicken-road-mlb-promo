const fs = require('fs');
const path = require('path');

const root = __dirname;
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');

const html = read('index.html');
const css = read('assets/styles.css');
const js = read('assets/config.js') + '\n' + read('assets/app.js');

const inlined = html
  .replace('<link rel="stylesheet" href="assets/styles.css">', '<style>\n' + css + '\n</style>')
  .replace(
    /<script src="assets\/config\.js"><\/script>\s*<script src="assets\/app\.js" defer><\/script>/,
    '<script>\n' + js + '\n</script>'
  );

if (inlined.includes('assets/styles.css') || inlined.includes('assets/app.js')) {
  console.error('! Не удалось заинлайнить ассеты — проверьте теги в index.html');
  process.exit(1);
}

fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
fs.writeFileSync(path.join(root, 'dist/index.html'), inlined);

const title = (inlined.match(/<title>([\s\S]*?)<\/title>/) || [, 'Chicken Road x Melbet'])[1];
const body = inlined.match(/<body>([\s\S]*)<\/body>/)[1];

const bootstrap =
  '<script>(function(){try{var q=new URLSearchParams(location.search).get("lang");' +
  'var l=q||localStorage.getItem("cr_lang")||"ar";var d=document.documentElement;' +
  'd.lang=l;d.dir=l==="fr"?"ltr":"rtl";}catch(e){document.documentElement.dir="rtl";}})();</script>\n';
const artifact =
  '<title>' + title + '</title>\n' + bootstrap +
  '<style>\n' + css + '\n</style>\n' + body;
fs.writeFileSync(path.join(root, 'dist/artifact.html'), artifact);

const kb = (s) => (Buffer.byteLength(s) / 1024).toFixed(1) + ' KB';
console.log('dist/index.html    ' + kb(inlined));
console.log('dist/artifact.html ' + kb(artifact));
