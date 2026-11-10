/* Página do certificado reemitido pelo painel admin (admin/certificado.html).
   Dados no #hash: { loja, cidade, quando, nMods, es } em JSON. */
(function () {
  const el = document.getElementById('cert');
  let c = null;
  try { c = JSON.parse(decodeURIComponent(location.hash.slice(1))); } catch (e) { /* hash inválido */ }
  if (!c || !c.loja) { el.innerHTML = '<p class="cert-dica">Certificado não encontrado. Abra de novo pela ficha da loja no painel.</p>'; return; }
  const idi = c.idioma || (c.es ? 'es' : 'pt');
  const T = (pt, es, en) => (idi === 'es' ? es : idi === 'en' ? en : pt);
  document.documentElement.lang = T('pt-BR', 'es', 'en');
  document.title = `${T('Certificado', 'Certificado', 'Certificate')} · ${c.loja}`;
  el.innerHTML = TREINO.certificadoHTML(Object.assign({}, c, { logo: '../assets/bigou-logo.png' })) + `
    <div class="t-cta center no-print"><button type="button" class="t-btn primary lg" id="cert-print">${T('Baixar ou imprimir', 'Descargar o imprimir', 'Download or print')}</button></div>
    <p class="cert-dica no-print">${T('Para baixar, escolha "Salvar como PDF" na janela de impressão.', 'Para descargarlo, elige "Guardar como PDF" en la ventana de impresión.', 'To download, choose "Save as PDF" in the print window.')}</p>`;
  document.getElementById('cert-print').addEventListener('click', () => window.print());
})();
