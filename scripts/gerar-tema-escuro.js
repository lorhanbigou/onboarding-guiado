// Gera css/admin-escuro.css a partir de css/admin.css: o modo escuro do painel.
//
// Para cada regra do admin.css, as cores claras de fundo/borda viram superfícies escuras
// e os textos escuros viram claros, mantendo o tom (verde continua verde). Tudo fica sob
// :root[data-tema="escuro"], então só vale quando o tema escuro está ligado.
// Não mexe em: variáveis (definidas à mão em admin.css), cores com transparência,
// verdes/vermelhos saturados de destaque e o menu lateral (já é escuro).
//
// Rode depois de alterar o admin.css:  npm run tema:escuro
// O build da Netlify também roda este script, então o site publicado nunca fica defasado.
const fs = require('fs'), path = require('path');

const raiz = path.join(__dirname, '..');
const ENTRADA = path.join(raiz, 'css', 'admin.css');
const PREFIXO = ':root[data-tema="escuro"]';

/* ---------- Cores ---------- */
const hexRgb = (h) => {
  h = h.slice(1);
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
};
function rgbHsl([r, g, b]) {
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2;
  if (mx === mn) return [0, 0, l];
  const d = mx - mn, s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
  const h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h * 60, s, l];
}
function hslHex([h, s, l]) {
  const k = (n) => (n + h / 30) % 12, a = s * Math.min(l, 1 - l);
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return '#' + [f(0), f(8), f(4)].map((x) => Math.round(Math.max(0, Math.min(1, x)) * 255).toString(16).padStart(2, '0')).join('');
}
const lim = (x, a, b) => Math.max(a, Math.min(b, x));

// Superfície clara (fundo, borda, anel) → superfície escura do mesmo tom
function superficie(hex) {
  const [h, s, l] = rgbHsl(hexRgb(hex));
  if (l < 0.72) return null;                       // já é média/escura: fica
  const nl = l >= 0.955 ? 0.125 - (1 - l) * 1.1    // branco e quase branco: cartões e fundo
    : 0.15 + (0.955 - l) * 0.75;                   // tons claros (selos, faixas, bordas)
  // Cinzas e brancos ganham o leve tom verde do fundo escuro; cores com tom mantêm o tom
  if (s < 0.12) return hslHex([150, 0.16, lim(nl, 0.08, 0.34)]);
  return hslHex([h, Math.min(0.5, s * 0.55), lim(nl, 0.08, 0.34)]);
}
// Texto escuro → texto claro do mesmo tom
function texto(hex) {
  const [h, s, l] = rgbHsl(hexRgb(hex));
  if (l > 0.55) return null;                       // já é claro
  if (s < 0.3) return hslHex([h, Math.min(s, 0.12), lim(0.95 - l * 0.75, 0.6, 0.94)]);  // tinta neutra
  return hslHex([h, Math.min(0.75, s), lim(0.68 + (0.45 - l) * 0.2, 0.62, 0.8)]);       // texto colorido
}

const PROPS_FUNDO = /^(background|background-color|background-image|border|border-(top|right|bottom|left)(-color)?|border-color|outline|outline-color|box-shadow|text-decoration-color|caret-color)$/;
const PROPS_TEXTO = /^(color|fill|stroke|-webkit-text-fill-color)$/;

function converter(prop, valor) {
  const fundo = PROPS_FUNDO.test(prop), txt = PROPS_TEXTO.test(prop);
  if (!fundo && !txt) return null;
  let mudou = false;
  // rgba claro quase opaco (ex.: cabeçalho translúcido) vira o equivalente escuro com a mesma opacidade
  valor = valor.replace(/rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d.]+)\s*\)/g, (m, r, g, b, a) => {
    if (!fundo || +a < 0.6) return m;
    const hx = '#' + [r, g, b].map((x) => (+x).toString(16).padStart(2, '0')).join('');
    const nv = superficie(hx);
    if (!nv) return m;
    mudou = true;
    const [R, G, B] = hexRgb(nv).map((x) => Math.round(x * 255));
    return `rgba(${R},${G},${B},${a})`;
  });
  const novo = valor.replace(/#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b/g, (c) => {
    // fill/stroke claros (ícone branco sobre botão verde) ficam; fill escuro de texto clareia
    const r = fundo ? superficie(c) : texto(c);
    if (r && r.toLowerCase() !== c.toLowerCase()) { mudou = true; return r; }
    return c;
  });
  return mudou || novo !== valor ? novo : null;
}

/* ---------- CSS: regras e @media (um nível) ---------- */
function blocos(css) {
  const out = [];
  let i = 0;
  while (i < css.length) {
    const ab = css.indexOf('{', i);
    if (ab < 0) break;
    const cab = css.slice(i, ab).trim();
    let prof = 1, j = ab + 1;
    while (j < css.length && prof) { if (css[j] === '{') prof++; else if (css[j] === '}') prof--; j++; }
    out.push({ cab, corpo: css.slice(ab + 1, j - 1) });
    i = j;
  }
  return out;
}
const PULA = (sel) => /data-tema/.test(sel) || /(^|[\s>+~,])\.sb(\b|-)|\.sb-|#adm-tip|\.lg-bg/.test(sel) || /^(@|from|to|\d)/.test(sel);
function prefixar(sel) {
  return sel.split(',').map((x) => x.trim()).filter(Boolean).map((x) => {
    if (x.startsWith(':root')) return PREFIXO + x.slice(5);
    if (x.startsWith('html')) return PREFIXO + x.slice(4);
    return `${PREFIXO} ${x}`;
  }).join(',\n');
}
function regra(cab, corpo) {
  if (PULA(cab)) return '';
  const decl = [];
  for (const d of corpo.split(';')) {
    const k = d.indexOf(':');
    if (k < 0) continue;
    const prop = d.slice(0, k).trim().toLowerCase(), val = d.slice(k + 1).trim();
    if (prop.startsWith('--')) continue;            // variáveis: definidas à mão
    const n = converter(prop, val);
    if (n) decl.push(`  ${prop}: ${n};`);
  }
  return decl.length ? `${prefixar(cab)} {\n${decl.join('\n')}\n}\n` : '';
}

const css = fs.readFileSync(ENTRADA, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
let saida = '/* GERADO por scripts/gerar-tema-escuro.js a partir de admin.css. Não edite à mão: rode npm run tema:escuro. */\n';
for (const b of blocos(css)) {
  if (b.cab.startsWith('@media') || b.cab.startsWith('@supports')) {
    const dentro = blocos(b.corpo).map((x) => regra(x.cab, x.corpo)).join('');
    if (dentro) saida += `${b.cab} {\n${dentro}}\n`;
  } else if (!b.cab.startsWith('@')) saida += regra(b.cab, b.corpo);
}

const destino = process.argv[2] || path.join(raiz, 'css', 'admin-escuro.css');
fs.writeFileSync(destino, saida);
console.log(`Tema escuro: ${path.relative(raiz, destino)} (${saida.split('\n').length} linhas)`);
