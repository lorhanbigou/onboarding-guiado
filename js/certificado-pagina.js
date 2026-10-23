/* Página do certificado reemitido pelo painel admin (admin/certificado.html).
   Dados no #hash: { loja, cidade, quando, nMods, es } em JSON. */
(function () {
  const el = document.getElementById('cert');
  let c = null;
  try { c = JSON.parse(decodeURIComponent(location.hash.slice(1))); } catch (e) { /* hash inválido */ }
  if (!c || !c.loja) { el.innerHTML = '<p class="cert-dica">Certificado não encontrado. Abra de novo pela ficha da loja no painel.</p>'; return; }
  const T = (pt, es) => (c.es ? es : pt);
  document.documentElement.lang = T('pt-BR', 'es');
  document.title = `${T('Certificado', 'Certificado')} · ${c.loja}`;
  el.innerHTML = TREINO.certificadoHTML(Object.assign({}, c, { logo: '../assets/bigou-logo.png' })) + `
    <div class="t-cta center no-print"><button type="button" class="t-btn primary lg" id="cert-print">${T('Baixar ou imprimir', 'Descargar o imprimir')}</button></div>
    <p class="cert-dica no-print">${T('Para baixar, escolha "Salvar como PDF" na janela de impressão.', 'Para descargarlo, elige "Guardar como PDF" en la ventana de impresión.')}</p>`;
  document.getElementById('cert-print').addEventListener('click', () => window.print());
})();
