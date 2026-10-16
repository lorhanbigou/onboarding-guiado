// Build da Netlify: copia só o que o navegador precisa para dist/ e grava ali o
// js/registro-config.js do ambiente (variáveis SUPABASE_URL, SUPABASE_ANON_KEY,
// ADMIN_EMAIL do site). README, serve.js, SQL etc. ficam fora do site publicado.
// Na Netlify, sem as variáveis o build falha, para o stage nunca publicar
// apontando para o banco de produção por engano.
const fs = require('fs'), path = require('path');
const { montarConfig, faltando } = require('./gerar-config');

const raiz = path.join(__dirname, '..');
const dist = path.join(raiz, 'dist');
const PUBLICOS = ['index.html', 'admin', 'css', 'js', 'assets'];

const { NETLIFY, CONTEXT, BRANCH } = process.env;
const falta = faltando(process.env);
if (falta.length && NETLIFY === 'true') {
  console.error(`Erro: defina ${falta.join(', ')} nas variáveis de ambiente do site na Netlify.`);
  process.exit(1);
}

fs.rmSync(dist, { recursive: true, force: true });
for (const item of PUBLICOS) fs.cpSync(path.join(raiz, item), path.join(dist, item), { recursive: true });

if (falta.length) {
  console.log('Variáveis do Supabase não definidas; dist/ usa o config vazio (sem Supabase).');
} else {
  const origem = `${CONTEXT || 'local'}${BRANCH ? ' · ' + BRANCH : ''}`;
  fs.writeFileSync(path.join(dist, 'js', 'registro-config.js'), montarConfig(process.env, origem));
  console.log(`dist/ pronto → ${process.env.SUPABASE_URL}`);
}
