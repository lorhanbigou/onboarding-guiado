// Monta o conteúdo de js/registro-config.js a partir das variáveis de ambiente:
//   SUPABASE_URL, SUPABASE_ANON_KEY, ADMIN_EMAIL
// Usado pelo build da Netlify (scripts/build.js, grava em dist/) e pelo serve.js
// local (npm run dev / dev:main). O arquivo versionado fica vazio (sem Supabase).
// Recursos opcionais por ambiente (sem a variável, vale o padrão de js/data.js):
// RECURSO_ASSISTENTE=false desliga o assistente de dúvidas (chat), que vem ligado;
// RECURSO_DEBUG=true mostra o botão Debug do treinamento (nunca na produção).
const CHAVES = ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'ADMIN_EMAIL'];
const faltando = (env) => CHAVES.filter((k) => !env[k]);
const ligado = (v) => /^(1|true|sim|on)$/i.test(String(v || '').trim());

// Só entra no arquivo o recurso cuja variável foi definida; o resto fica com o padrão do código
function recursos(env) {
  const r = {};
  if (String(env.RECURSO_ASSISTENTE || '').trim()) r.assistente = ligado(env.RECURSO_ASSISTENTE);
  r.debug = ligado(env.RECURSO_DEBUG);
  return r;
}

function montarConfig(env, origem) {
  return `/* Gerado por scripts/gerar-config.js (${origem}). Não editar. */
window.TREINO_ANALYTICS = {
  url: ${JSON.stringify(env.SUPABASE_URL)},
  anonKey: ${JSON.stringify(env.SUPABASE_ANON_KEY)},
  adminEmail: ${JSON.stringify(env.ADMIN_EMAIL)},
};
window.TREINO_RECURSOS = ${JSON.stringify(recursos(env))};
`;
}

module.exports = { montarConfig, faltando };
