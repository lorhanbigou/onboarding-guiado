/* =========================================================================
   CERTIFICADO — markup único, usado pelo treinamento e pelo painel admin
   (o painel reemite o certificado de uma loja certificada, no idioma dela).
   ========================================================================= */
(function () {
  const TREINO = window.TREINO || (window.TREINO = {});   // admin/certificado.html carrega só este arquivo
  const MEDALHA = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 3l2.5 6M16 3l-2.5 6"/><circle cx="12" cy="14.5" r="5.5"/><path d="M12 11.8l.9 1.8 2 .3-1.4 1.4.3 2-1.8-1-1.8 1 .3-2-1.4-1.4 2-.3z"/></svg>';
  const esc = (t) => String(t == null ? '' : t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /** c = { loja, cidade, quando (data ISO ou ms), nMods, es, logo } */
  TREINO.certificadoHTML = function (c) {
    const T = (pt, es) => (c.es ? es : pt);
    const data = new Date(c.quando).toLocaleDateString(T('pt-BR', 'es'), { day: '2-digit', month: 'long', year: 'numeric' });
    const logo = c.logo || 'assets/bigou-logo.png';
    return `
          <article class="cert" aria-label="${T('Certificado de conclusão', 'Certificado de finalización')}">
            <div class="cert-borda">
              <img class="cert-logo" src="${esc(logo)}" alt="Bigou" width="64" height="64">
              <span class="cert-kicker">${T('Certificado de conclusão', 'Certificado de finalización')}</span>
              <p class="cert-txt">${T('Certificamos que', 'Certificamos que')}</p>
              <h1 class="cert-loja">${esc(c.loja || T('Parceiro Bigou', 'Socio Bigou'))}</h1>
              ${c.cidade ? `<p class="cert-cidade">${esc(c.cidade)}</p>` : ''}
              <p class="cert-txt">${T(`concluiu o <b>Treinamento Financeiro</b>, com os ${c.nMods} módulos: vendas e formas de pagamento, tela Financeiro, fatura, repasse e antecipação.`, `completó la <b>Capacitación Financiera</b>, con los ${c.nMods} módulos: ventas y formas de pago, pantalla Finanzas, factura, transferencia y anticipo.`)}</p>
              <div class="cert-rodape">
                <div><small>${T('Concluído em', 'Completado el')}</small><b>${data}</b></div>
                <div class="cert-selo">${MEDALHA}</div>
                <div class="cert-emissor"><b>Bigou Delivery</b></div>
              </div>
              <p class="cert-nota">${T('Treinamento ilustrativo: os valores usados são fictícios. Confira no seu contrato os valores praticados na sua loja.', 'Capacitación ilustrativa: los valores usados son ficticios. Consulta en tu contrato los valores que se aplican a tu tienda.')}</p>
            </div>
          </article>`;
  };
})();
