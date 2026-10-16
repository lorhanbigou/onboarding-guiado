// Corta a narração gravada (um mp3 único) em um arquivo por balão do treinamento.
//   node scripts/narracao/cortar.js "<narração completa>.mp3"
// Usa scripts/narracao/cortes.json (balão → trechos [ini, fim] em segundos, do áudio original)
// e grava assets/audio/<balão>.mp3 + js/narracao.js (índice que o app consulta).
// Precisa do ffmpeg no PATH (ou na variável FFMPEG).
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');

const origem = process.argv[2];
if (!origem || !fs.existsSync(origem)) {
  console.error('Uso: node scripts/narracao/cortar.js "<narração completa>.mp3"');
  process.exit(1);
}
const ffmpeg = process.env.FFMPEG || 'ffmpeg';
const raiz = path.join(__dirname, '..', '..');
const destino = path.join(raiz, 'assets', 'audio');
const cortes = JSON.parse(fs.readFileSync(path.join(__dirname, 'cortes.json'), 'utf8'));

const FADE = 0.03, PAUSA = 0.35;   // fade curto nas bordas; pausa entre trechos de um mesmo balão
fs.rmSync(destino, { recursive: true, force: true });
fs.mkdirSync(destino, { recursive: true });

const indice = {};
for (const [balao, trechos] of Object.entries(cortes)) {
  const filtros = [], rotulos = [];
  trechos.forEach((t, i) => {
    const dur = t.fim - t.ini;
    filtros.push(`[0:a]atrim=${t.ini}:${t.fim},asetpts=N/SR/TB,afade=t=in:d=${FADE},afade=t=out:st=${(dur - FADE * 2).toFixed(3)}:d=${FADE * 2}[t${i}]`);
    if (i) {
      filtros.push(`anullsrc=r=44100:cl=mono,atrim=0:${PAUSA}[p${i}]`);
      rotulos.push(`[p${i}]`);
    }
    rotulos.push(`[t${i}]`);
  });
  filtros.push(`${rotulos.join('')}concat=n=${rotulos.length}:v=0:a=1[s]`);
  const arquivo = `${balao}.mp3`;
  execFileSync(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-y', '-i', origem,
    '-filter_complex', filtros.join(';'), '-map', '[s]', '-ac', '1', '-ar', '44100', '-b:a', '64k', path.join(destino, arquivo)]);
  indice[balao] = `assets/audio/${arquivo}`;
}

fs.writeFileSync(path.join(raiz, 'js', 'narracao.js'),
  `/* Gerado por scripts/narracao/cortar.js. Não editar. Balão → áudio gravado
   (chave: "<módulo>-abertura", "<módulo>-<passo>" ou "<módulo>-resumo"). */
window.TREINO_NARRACAO = ${JSON.stringify(indice, null, 2)};
`);
console.log(`${Object.keys(indice).length} áudios em assets/audio/ e índice em js/narracao.js`);
