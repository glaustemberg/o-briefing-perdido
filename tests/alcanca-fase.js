#!/usr/bin/env node
// Verifica se cada heroi consegue ir do P ate o X, simulando o pulo com as constantes reais de herois.js.
// O eixo vertical e exato (mesma integracao de OBP.Fisica); o horizontal supoe corrida ja na velocidade
// maxima, entao um "ALCANCA" apertado na horizontal merece teste no jogo. Uso: node tests/alcanca-fase.js [arquivo...]
const vm = require('vm');
const fs = require('fs');
const path = require('path');
const RAIZ = path.join(__dirname, '..');
const TILE = 32;
// A esteira saiu do escopo e os marcadores > e < viraram chao (decisao 82). Eles NAO voltam para esta lista:
// nao estao em OBP.Mapa.LEG, entao no jogo viram BURACO, e trata-los como solido aqui foi o que escondeu 12
// tiles de chao inexistentes no comeco da fase 5.
const SOLIDO = '#*?RC';        // bloqueiam dos quatro lados
const PLATAF = '=';           // atravessa de baixo, pousa em cima
const PERIGO = '^';           // espinho: nao pisa

function carrega(rel) {
  const sandbox = {}; sandbox.window = sandbox; vm.createContext(sandbox);
  for (const f of [path.join(RAIZ, 'js', 'systems', 'Mapa.js'), path.join(RAIZ, rel)]) {
    vm.runInContext(fs.readFileSync(f, 'utf8'), sandbox, { filename: f });
  }
  const herois = {}; sandbox.OBP.HEROIS = herois;
  vm.runInContext(fs.readFileSync(path.join(RAIZ, 'js', 'data', 'herois.js'), 'utf8'), sandbox);
  const chave = Object.keys(sandbox.OBP.FASES)[0];
  return { chave, linhas: sandbox.OBP.FASES[chave].mapa, herois: sandbox.OBP.HEROIS };
}

// quebraveis: '*' os dois quebram com soco, 'R' so o gilpp. Passar 'quebra' remove esses tiles do mapa,
// para descobrir o que o heroi alcanca DEPOIS de abrir caminho no soco.
function criaMundo(linhas, quebra) {
  if (quebra) linhas = linhas.map(l => [...l].map(c => quebra.includes(c) ? '.' : c).join(''));
  const alt = linhas.length, larg = linhas[0].length;
  const em = (c, l) => (c < 0 || c >= larg || l < 0 || l >= alt) ? '#' : linhas[l][c];
  return { alt, larg, em,
    solido: (c, l) => SOLIDO.includes(em(c, l)),
    plataforma: (c, l) => em(c, l) === PLATAF,
    perigo: (c, l) => em(c, l) === PERIGO };
}

// caixa do heroi: largura w centrada em x, altura h com o pe em y
function bate(m, x, y, w, h, comPlataforma, yAnterior) {
  const c0 = Math.floor((x - w / 2) / TILE), c1 = Math.floor((x + w / 2 - 1) / TILE);
  const l0 = Math.floor((y - h) / TILE), l1 = Math.floor((y - 1) / TILE);
  for (let c = c0; c <= c1; c++) for (let l = l0; l <= l1; l++) {
    if (m.solido(c, l)) return true;
    if (comPlataforma && m.plataforma(c, l)) {          // so colide descendo e vindo de cima
      const topo = l * TILE;
      if (y > topo && yAnterior <= topo) return true;
    }
  }
  return false;
}

function apoiado(m, c, l, h) {                          // pe na linha l, apoio na linha l+1
  if (!(m.solido(c, l + 1) || m.plataforma(c, l + 1)) || m.perigo(c, l + 1)) return false;
  for (let i = 0; i < Math.ceil(h / TILE); i++) if (m.solido(c, l - i) || m.perigo(c, l - i)) return false;
  return true;
}

// simula um pulo e devolve todas as poses de pouso (coluna, linha do pe)
function pulos(m, heroi, c0, l0) {
  const { w, h } = heroi.hitbox, dt = 1 / 240, destinos = new Set();
  for (const dir of [-1, 0, 1]) for (const corte of [0, 0.06, 0.12, 0.2, 99]) {
    let x = c0 * TILE + TILE / 2, y = (l0 + 1) * TILE, vy = -heroi.v0, vx = dir * heroi.vel;
    let pausa = 0, pausou = false, cortou = false;
    for (let t = 0; t < 3; t += dt) {
      if (!cortou && t >= corte && vy < 0) { vy *= 0.5; cortou = true; }
      if (!pausou && vy >= 0) { pausa = heroi.apiceMs / 1000; pausou = true; }
      const g = pausa > 0 ? 0 : (vy < 0 ? heroi.gSubida : heroi.gQueda);
      pausa = Math.max(0, pausa - dt);
      vy += g * dt;
      const nx = x + vx * dt;
      if (!bate(m, nx, y, w, h, false, y)) x = nx; else vx = 0;
      const ny = y + vy * dt;
      if (bate(m, x, ny, w, h, vy > 0, y)) {
        if (vy > 0) {                                   // pousou: a linha de apoio e a do y ANTERIOR, ainda livre
          const l = Math.floor((y - 1) / TILE), c = Math.floor(x / TILE);
          if (apoiado(m, c, l, h)) destinos.add(c + ':' + l);
          break;
        }
        vy = 0;                                         // bateu a cabeca
      } else y = ny;
      if (y > (m.alt + 2) * TILE) break;                // caiu do mapa
    }
  }
  return [...destinos].map(s => s.split(':').map(Number));
}

function alcanca(linhas, heroi, quebra) {
  const m = criaMundo(linhas, quebra), { h } = heroi.hitbox;
  let ini = null, fim = null;
  linhas.forEach((l, i) => { const p = l.indexOf('P'), x = l.indexOf('X');
    if (p >= 0) ini = [p, i]; if (x >= 0) fim = [x, i]; });
  if (!ini || !fim) return { erro: 'mapa sem P ou X' };
  const pousa = (c, l) => { let r = l; while (r < m.alt && !apoiado(m, c, r, h)) r++; return r < m.alt ? [c, r] : null; };
  const partida = pousa(ini[0], ini[1]); const chegada = pousa(fim[0], fim[1]);
  if (!partida || !chegada) return { erro: 'P ou X sem chao embaixo' };
  const vistos = new Set([partida.join(':')]); const fila = [partida]; let maisLonge = partida[0];
  while (fila.length) {
    const [c, l] = fila.shift(); maisLonge = Math.max(maisLonge, c);
    const vizinhos = [];
    for (const d of [-1, 1]) {
      if (apoiado(m, c + d, l, h)) vizinhos.push([c + d, l]);
      else { let r = l; while (r < m.alt && !apoiado(m, c + d, r, h)) { if (m.solido(c + d, r) || m.solido(c + d, r - 1)) { r = -1; break; } r++; }
             if (r > 0 && r < m.alt) vizinhos.push([c + d, r]); }
    }
    vizinhos.push(...pulos(m, heroi, c, l));
    for (const v of vizinhos) { const k = v.join(':');
      if (!vistos.has(k) && v[0] >= 0 && v[0] < m.larg) { vistos.add(k); fila.push(v); } }
  }
  // Chegada por PROXIMIDADE, nao por coluna. O teste antigo (`coluna >= a do X`) dava sempre positivo em mapa
  // vertical, onde a torre inteira tem a mesma largura: o gilpp nao subia um andar da fase 8b e mesmo assim
  // constava como "alcanca a saida" (decisao 82).
  const ok = [...vistos].some(k => {
    const [c, l] = k.split(':').map(Number);
    return Math.abs(c - chegada[0]) <= 1 && l - chegada[1] >= 0 && l - chegada[1] <= 4;
  });
  return { ok, maisLonge, meta: chegada[0], vistos };
}

// as flags (--onde) sao filtradas: sem isso o proprio --onde vira nome de arquivo de fase
const args = process.argv.slice(2).filter((a, i, t) => !a.startsWith('--') && (i === 0 || !t[i - 1].startsWith('--')));
const alvos = args.length ? args
  : fs.readdirSync(path.join(RAIZ, 'js', 'data')).filter(f => /^fase-0/.test(f)).map(f => 'js/data/' + f);
let falhou = false;
for (const rel of alvos) {
  const { chave, linhas, herois } = carrega(rel);
  for (const id of ['tikinho', 'gilpp']) {
    const r = alcanca(linhas, herois[id]);
    if (r.erro) { console.log(`${chave} ${id}: ERRO ${r.erro}`); falhou = true; continue; }
    if (r.ok) console.log(`${chave} ${id}: ALCANCA a saida`);
    else { console.log(`${chave} ${id}: BLOQUEADO na coluna ${r.maisLonge} (saida na ${r.meta})`); falhou = true; }
    // itens: uniao do que alcanca andando e do que alcanca depois de quebrar o que o heroi quebra
    const quebra = herois[id].quebraReforcado ? '*RC' : '*C';
    const comSoco = alcanca(linhas, herois[id], quebra);
    const pes = new Set([...(r.vistos || []), ...(comSoco.vistos || [])]);
    const perdidos = [];
    linhas.forEach((l, lin) => [...l].forEach((ch, col) => {
      if (ch !== '$' && ch !== 'A') return;
      let achou = false;
      for (let dc = -1; dc <= 1 && !achou; dc++) for (let dr = 0; dr <= 4 && !achou; dr++) if (pes.has((col + dc) + ':' + (lin + dr))) achou = true;
      if (!achou) perdidos.push(`(${col},${lin})`);
    }));
    if (perdidos.length) { console.log(`${chave} ${id}: ${perdidos.length} itens sem alcance: ${perdidos.join(' ')}`); falhou = true; }
    // --onde col,lin diz se o heroi consegue POUSAR naquela celula: serve para achar por que um item ficou de fora
    // --perfil mostra, por linha do mapa, quantas celulas o heroi consegue ocupar: e assim que se ve onde ele
    // fica preso num mapa vertical
    if (process.argv.includes('--perfil')) {
      const porLinha = {};
      for (const k of pes) { const l = Number(k.split(':')[1]); porLinha[l] = (porLinha[l] || 0) + 1; }
      const faixas = [];
      for (let l = 0; l < linhas.length; l += 5) {
        let n = 0; for (let j = l; j < l + 5 && j < linhas.length; j++) n += porLinha[j] || 0;
        faixas.push(`${l}:${n}`);
      }
      console.log(`  ${id} celulas por faixa de 5 linhas: ${faixas.join(' ')}`);
    }
    // --pulo col,lin lista para onde o heroi consegue saltar a partir daquela celula
    const ip = process.argv.indexOf('--pulo');
    if (ip > 0 && process.argv[ip + 1]) {
      const [c0, l0] = process.argv[ip + 1].split(',').map(Number);
      const mundo = criaMundo(linhas);
      console.log(`  ${id} pula de (${c0},${l0}) para: ${pulos(mundo, herois[id], c0, l0).map(v => v.join(',')).join(' ') || 'LUGAR NENHUM'}`);
    }
    const onde = process.argv.indexOf('--onde');
    if (onde > 0 && process.argv[onde + 1]) {
      const [c0, l0] = process.argv[onde + 1].split(',').map(Number);
      const perto = [...pes].filter(k => { const [c, l] = k.split(':').map(Number); return Math.abs(c - c0) <= 2 && Math.abs(l - l0) <= 4; });
      console.log(`  ${id} perto de (${c0},${l0}): ${perto.sort().join(' ') || 'NADA'}`);
    }
  }
}
process.exit(falhou ? 1 : 0);
