// Gera js/mapa-brasil.js: o mapa do Brasil (estados) e a posição das cidades do treinamento,
// usados na aba Cidades do painel. O site não pode carregar mapas de terceiros (CSP), então o
// desenho fica no próprio projeto, como SVG.
//
// Rode quando a lista de cidades (js/cidades.js) mudar:  npm run mapa   (precisa de internet)
// Fontes: malha dos estados do IBGE (servicodados.ibge.gov.br) e coordenadas dos municípios do
// conjunto público kelvins/municipios-brasileiros (dados do IBGE).
const fs = require('fs'), path = require('path');

const raiz = path.join(__dirname, '..');
const URL_MALHA = 'https://servicodados.ibge.gov.br/api/v3/malhas/paises/BR?formato=application/vnd.geo+json&qualidade=minima&intrarregiao=UF';
const URL_MUN = 'https://raw.githubusercontent.com/kelvins/municipios-brasileiros/main/json/municipios.json';
const URL_UF = 'https://raw.githubusercontent.com/kelvins/municipios-brasileiros/main/json/estados.json';

// Projeção equiretangular corrigida pela latitude do centro do Brasil
const LAT0 = -15, K = 20, COS = Math.cos((LAT0 * Math.PI) / 180);
const proj = ([lon, lat]) => [Math.round((lon + 74) * COS * K * 10) / 10, Math.round((6 - lat) * K * 10) / 10];
const norm = (t) => String(t).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

async function json(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${url} → HTTP ${r.status}`);
  return r.json();
}

(async () => {
  const [malha, muns, ufs] = await Promise.all([json(URL_MALHA), json(URL_MUN), json(URL_UF)]);
  const siglaPorCod = Object.fromEntries(ufs.map((u) => [String(u.codigo_uf), u.uf]));

  // Estados: caminho SVG + centro (média dos pontos do maior polígono) para o rótulo
  const uf = {};
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const f of malha.features) {
    const sigla = siglaPorCod[String(f.properties.codarea)];
    if (!sigla) continue;
    const polis = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
    let d = '', maior = null;
    for (const poli of polis) {
      for (const anel of poli) {
        const pts = anel.map(proj);
        pts.forEach(([x, y]) => { minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y); });
        d += 'M' + pts.map((p) => p.join(' ')).join('L') + 'Z';
      }
      if (!maior || poli[0].length > maior.length) maior = poli[0];
    }
    const c = maior.map(proj).reduce((a, p) => [a[0] + p[0], a[1] + p[1]], [0, 0]).map((v) => Math.round(v / maior.length));
    uf[sigla] = { d, c };
  }

  // Cidades do treinamento ("Muriaé - MG")
  global.window = {}; global.TREINO = {};
  eval(fs.readFileSync(path.join(raiz, 'js', 'cidades.js'), 'utf8'));
  const indice = new Map(muns.map((m) => [`${norm(m.nome)}|${siglaPorCod[String(m.codigo_uf)]}`, m]));
  const cid = {}, faltam = [];
  // Entradas com duas cidades ("Cordeiro / Cantagalo - RJ", "A - RJ / B - ES") ficam no ponto médio
  for (const nome of TREINO.cidades) {
    const ufFinal = (nome.match(/ - ([A-Z]{2})$/) || [])[1];
    const partes = nome.split(' / ').map((p) => { const [n, sg] = p.split(' - '); return indice.get(`${norm(n)}|${sg || ufFinal}`); }).filter(Boolean);
    if (!partes.length) { faltam.push(nome); continue; }
    const lon = partes.reduce((t, m) => t + m.longitude, 0) / partes.length, lat = partes.reduce((t, m) => t + m.latitude, 0) / partes.length;
    cid[nome] = proj([lon, lat]);
  }

  const vb = [Math.floor(minX) - 10, Math.floor(minY) - 10, Math.ceil(maxX - minX) + 20, Math.ceil(maxY - minY) + 20];
  const saida = `/* GERADO por scripts/gerar-mapa.js (npm run mapa). Não edite à mão.
   Estados: malha do IBGE · Cidades: coordenadas do IBGE (kelvins/municipios-brasileiros). */
window.TREINO = window.TREINO || {};
TREINO.MAPA = ${JSON.stringify({ vb, uf, cid })};
`;
  const destino = path.join(raiz, 'js', 'mapa-brasil.js');
  fs.writeFileSync(destino, saida);
  console.log(`Mapa: ${Object.keys(uf).length} estados, ${Object.keys(cid).length}/${TREINO.cidades.length} cidades, ${(saida.length / 1024).toFixed(1)} KB → js/mapa-brasil.js`);
  if (faltam.length) console.warn('Cidades não encontradas:', faltam.join(', '));
})().catch((e) => { console.error(e.message); process.exit(1); });
