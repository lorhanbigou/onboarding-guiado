// Monta o conteúdo de js/registro-config.js a partir das variáveis de ambiente:
//   SUPABASE_URL, SUPABASE_ANON_KEY, ADMIN_EMAIL
// Usado pelo build da Netlify (scripts/build.js, grava em dist/) e pelo serve.js
// local (npm run dev / dev:main). O arquivo versionado fica vazio (sem Supabase).
// Recursos opcionais por ambiente: RECURSO_ASSISTENTE=true liga o assistente de dúvidas (chat);
// RECURSO_DEBUG=true mostra o botão Debug do treinamento (nunca na produção).
const CHAVES = ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'ADMIN_EMAIL'];
const faltando = (env) => CHAVES.filter((k) => !env[k]);
const ligado = (v) => /^(1|true|sim|on)$/i.test(String(v || '').trim());

function montarConfig(env, origem) {
  return `/* Gerado por scripts/gerar-config.js (${origem}). Não editar. */
window.TREINO_ANALYTICS = {
  url: ${JSON.stringify(env.SUPABASE_URL)},
  anonKey: ${JSON.stringify(env.SUPABASE_ANON_KEY)},
  adminEmail: ${JSON.stringify(env.ADMIN_EMAIL)},
};
window.TREINO_RECURSOS = ${JSON.stringify({ assistente: ligado(env.RECURSO_ASSISTENTE), debug: ligado(env.RECURSO_DEBUG) })};
`;
}

module.exports = { montarConfig, faltando };
