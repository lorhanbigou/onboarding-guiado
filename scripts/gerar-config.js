// Monta js/registro-config.js a partir das variáveis de ambiente:
//   SUPABASE_URL, SUPABASE_ANON_KEY, ADMIN_EMAIL
// - Na Netlify (build): cada site define as suas (produção → main, stage → stage)
//   e o arquivo é reescrito. Sem elas o build falha, para o stage nunca publicar
//   apontando para o banco de produção por engano.
// - Local: serve.js usa montarConfig() com o .env escolhido (npm run dev / dev:main)
//   e não mexe no arquivo versionado, que fica vazio (modo demonstração).
const fs = require('fs'), path = require('path');

const CHAVES = ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'ADMIN_EMAIL'];
const faltando = (env) => CHAVES.filter((k) => !env[k]);

function montarConfig(env, origem) {
  return `/* Gerado por scripts/gerar-config.js (${origem}). Não editar. */
window.TREINO_ANALYTICS = {
  url: ${JSON.stringify(env.SUPABASE_URL)},
  anonKey: ${JSON.stringify(env.SUPABASE_ANON_KEY)},
  adminEmail: ${JSON.stringify(env.ADMIN_EMAIL)},
};
`;
}

module.exports = { montarConfig, faltando };

if (require.main === module) {
  const { NETLIFY, CONTEXT, BRANCH } = process.env;
  const falta = faltando(process.env);
  if (falta.length) {
    if (NETLIFY === 'true') {
      console.error(`Erro: defina ${falta.join(', ')} nas variáveis de ambiente do site na Netlify.`);
      process.exit(1);
    }
    console.log('Variáveis do Supabase não definidas; mantendo js/registro-config.js versionado.');
    process.exit(0);
  }
  const destino = path.join(__dirname, '..', 'js', 'registro-config.js');
  fs.writeFileSync(destino, montarConfig(process.env, `${CONTEXT || 'local'}${BRANCH ? ' · ' + BRANCH : ''}`));
  console.log(`js/registro-config.js gerado → ${process.env.SUPABASE_URL}`);
}
