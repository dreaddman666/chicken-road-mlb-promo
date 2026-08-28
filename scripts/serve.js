const http = require('http'), fs = require('fs'), path = require('path'), zlib = require('zlib');

const root = path.resolve(process.argv[2] || 'dist');
const port = +(process.argv[3] || 8787);
const mime = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon'
};

http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p.endsWith('/')) p += 'index.html';
  const file = path.join(root, path.normalize(p).replace(/^(\.\.[/\\])+/, ''));
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404, { 'Content-Type': 'text/plain' }); return res.end('404'); }
    const type = mime[path.extname(file)] || 'application/octet-stream';
    const gz = /text|javascript|json|svg/.test(type) && /gzip/.test(req.headers['accept-encoding'] || '');
    const headers = { 'Content-Type': type, 'Cache-Control': 'public, max-age=31536000' };
    if (gz) headers['Content-Encoding'] = 'gzip';
    res.writeHead(200, headers);
    res.end(gz ? zlib.gzipSync(data) : data);
  });
}).listen(port, () => console.log('serving ' + root + ' on http://127.0.0.1:' + port + '/'));
