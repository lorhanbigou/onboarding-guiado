// Gera js/registro-config.js a partir das variáveis de ambiente do deploy (Netlify).
// Cada site da Netlify (produção → branch main, stage → branch stage) define as suas:
//   SUPABASE_URL, SUPABASE_ANON_KEY, ADMIN_EMAIL
// Na Netlify as três são obrigatórias: sem elas o build falha, para o stage nunca
// publicar apontando para o banco de produção por engano.
// Rodando local sem as variáveis, o arquivo versionado (produção) fica como está.
const fs = require('fs'), path = require('path');

const { SUPABASE_URL, SUPABASE_ANON_KEY, ADMIN_EMAIL, NETLIFY, CONTEXT, BRANCH } = process.env;
const faltando = ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'ADMIN_EMAIL'].filter((k) => !process.env[k]);

if (faltando.length) {
  if (NETLIFY === 'true') {
    console.error(`Erro: defina ${faltando.join(', ')} nas variáveis de ambiente do site na Netlify.`);
    process.exit(1);
  }
  console.log('Variáveis do Supabase não definidas; mantendo js/registro-config.js versionado.');
  process.exit(0);
}

const destino = path.join(__dirname, '..', 'js', 'registro-config.js');
const conteudo = `/* Gerado no deploy por scripts/gerar-config.js (${CONTEXT || 'local'}${BRANCH ? ' · ' + BRANCH : ''}). Não editar. */
window.TREINO_ANALYTICS = {
  url: ${JSON.stringify(SUPABASE_URL)},
  anonKey: ${JSON.stringify(SUPABASE_ANON_KEY)},
  adminEmail: ${JSON.stringify(ADMIN_EMAIL)},
};
`;
fs.writeFileSync(destino, conteudo);
console.log(`js/registro-config.js gerado → ${SUPABASE_URL}`);
