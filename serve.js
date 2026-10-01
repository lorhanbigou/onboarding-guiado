// Servidor estático simples para abrir o treinamento: node serve.js  →  http://localhost:5178
const http = require('http'), fs = require('fs'), path = require('path'), os = require('os');
const root = __dirname, port = process.env.PORT || 5178;
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png' };

function getNetworkIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name]) {
      if ((net.family === 'IPv4' || net.family === 4) && !net.internal) {
        return net.address;
      }
    }
  }
  return '127.0.0.1';
}

const server = http.createServer((req, res) => {
  const p = path.normalize(decodeURIComponent(req.url.split('?')[0])).replace(/^(\.\.[\/\\])+/, '');
  const file = path.join(root, p === '/' ? 'index.html' : p);
  if (!file.startsWith(root)) { res.writeHead(403); return res.end(); }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); return res.end('Não encontrado'); }
    res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(data);
  });
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Erro: A porta ${port} já está em uso por outro processo.`);
  } else {
    console.error('Erro no servidor:', err.message);
  }
  process.exit(1);
});

server.listen(port, '0.0.0.0', () => {
  const netIp = getNetworkIp();
  console.log(`Treinamento rodando em:`);
  console.log(`  - Local:   http://localhost:${port}`);
  console.log(`  - Rede:    http://${netIp}:${port}`);
});


