// Tema do painel (claro/escuro). Carregado no <head> para não piscar claro ao abrir.
// Sem escolha salva, segue o sistema do computador.
(function () {
  var K = 'bigou-admin-tema';
  var salvo = null;
  try { salvo = localStorage.getItem(K); } catch (e) { /* sem armazenamento */ }
  var mq = window.matchMedia ? matchMedia('(prefers-color-scheme: dark)') : null;
  function aplicar(t) { document.documentElement.setAttribute('data-tema', t); }
  aplicar(salvo === 'escuro' || salvo === 'claro' ? salvo : mq && mq.matches ? 'escuro' : 'claro');
  if (mq && mq.addEventListener) mq.addEventListener('change', function (e) { var s = null; try { s = localStorage.getItem(K); } catch (x) { /* */ } if (!s) aplicar(e.matches ? 'escuro' : 'claro'); });
  window.TemaAdmin = {
    atual: function () { return document.documentElement.getAttribute('data-tema') || 'claro'; },
    alternar: function () { var t = this.atual() === 'escuro' ? 'claro' : 'escuro'; aplicar(t); try { localStorage.setItem(K, t); } catch (e) { /* */ } return t; },
  };
})();
