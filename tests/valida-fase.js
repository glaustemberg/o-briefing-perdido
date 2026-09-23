#!/usr/bin/env node
// Validador de mapa ASCII de fase (Node puro, sem dependencia).
// Carrega js/systems/Mapa.js + um js/data/fase-0N.js num window/OBP falso via vm,
// roda o parser de verdade e confere as regras mensuraveis do brief M1.
// Uso: node tests/valida-fase.js js/data/fase-02.js

const vm = require('vm');
const fs = require('fs');
const path = require('path');

const RAIZ = path.join(__dirname, '..');

const DIMENSOES = {
  'fase-01': { larg: 128, alt: 14 },
  'fase-02': { larg: 160, alt: 14 },
  'fase-03': { larg: 240, alt: 12 },
  'fase-04': { larg: 24, alt: 120 },
};

function validaArquivo(caminhoRelativo) {
  const caminho = path.isAbsolute(caminhoRelativo) ? caminhoRelativo : path.join(RAIZ, caminhoRelativo);

  const sandbox = {};
  sandbox.window = sandbox; // window === o proprio contexto global do sandbox
  vm.createContext(sandbox);

  const mapaJs = path.join(RAIZ, 'js', 'systems', 'Mapa.js');
  vm.runInContext(fs.readFileSync(mapaJs, 'utf8'), sandbox, { filename: mapaJs });
  vm.runInContext(fs.readFileSync(caminho, 'utf8'), sandbox, { filename: caminho });

  const OBP = sandbox.OBP;
  if (!OBP || !OBP.FASES) {
    console.log(`--- ${caminhoRelativo}: FALHOU`);
    console.log(' - arquivo nao definiu OBP.FASES');
    return false;
  }

  const chaves = Object.keys(OBP.FASES);
  let tudoOk = true;

  for (const chave of chaves) {
    const fase = OBP.FASES[chave];
    console.log(`--- ${chave} (${caminhoRelativo}) ---`);
    const erros = [];

    let m;
    try {
      m = OBP.Mapa.parse(fase.mapa);
    } catch (e) {
      erros.push(`parser: ${e.message}`);
      erros.forEach((e) => console.log(' - ' + e));
      console.log('FALHOU');
      tudoOk = false;
      continue;
    }

    // dimensoes exatas da tabela da spec (quando a fase e conhecida)
    const esperado = DIMENSOES[chave];
    if (esperado) {
      if (m.larg !== esperado.larg) erros.push(`largura ${m.larg} != ${esperado.larg} esperado`);
      if (m.alt !== esperado.alt) erros.push(`altura ${m.alt} != ${esperado.alt} esperado`);
    }

    // caracteres permitidos: LEG + ENTIDADES + '.'
    const permitidos = new Set([...Object.keys(OBP.Mapa.LEG), ...OBP.Mapa.ENTIDADES.split(''), '.']);   // '>' '<' 'o' viram buraco (decisao 82)
    fase.mapa.forEach((linha, lin) => {
      [...linha].forEach((ch, col) => {
        if (!permitidos.has(ch)) erros.push(`caractere '${ch}' invalido em col ${col} lin ${lin}`);
      });
    });

    const conta = (ch) => m.entidades.filter((e) => e.ch === ch).length;
    const contaTile = (idx) => m.dados.reduce((n, fila) => n + fila.filter((v) => v === idx).length, 0);

    const estrelas = contaTile(OBP.Mapa.LEG['*']);
    const perguntas = contaTile(OBP.Mapa.LEG['?']);
    const sacos = conta('$');
    const inimigos = conta('1') + conta('2') + conta('3');
    const npcs = conta('N');

    if (estrelas < 12) erros.push(`estrelas ${estrelas} < 12`);
    if (perguntas !== 3) erros.push(`perguntas ${perguntas} != 3`);
    if (sacos !== 16) erros.push(`sacos ${sacos} != 16`);
    // piso de 6, nao igualdade: a decisao 67 subiu a densidade das fases em escopo (a fase 1 foi a 13 marcas)
    if (inimigos < 6) erros.push(`inimigos ${inimigos} < 6`);
    if (npcs < 1 || npcs > 2) erros.push(`npcs ${npcs} fora da faixa 1-2`);

    // fase 8 e dividida em 8a e 8b: K e A ficam em uma metade cada (spec secao 5)
    const duasPartes = /fase-08[ab]/.test(caminhoRelativo);
    for (const ch of ['P', 'K', 'X', 'A']) {
      const n = conta(ch);
      if (duasPartes && (ch === 'K' || ch === 'A') && n === 0) continue;
      if (n !== 1) erros.push(`${ch} aparece ${n}x, esperado exatamente 1x`);
    }

    // K precisa estar entre 45% e 55% da largura (fase horizontal) ou altura (fase vertical)
    const kEnt = m.entidades.find((e) => e.ch === 'K');
    if (kEnt) {
      const horizontal = m.larg >= m.alt;
      const eixo = horizontal ? kEnt.col : kEnt.lin;
      const total = horizontal ? m.larg : m.alt;
      const pct = (eixo / total) * 100;
      if (pct < 45 || pct > 55) {
        erros.push(`K em ${pct.toFixed(1)}% fora da faixa 45-55% (${horizontal ? 'largura' : 'altura'})`);
      }
    }

    if (erros.length) {
      erros.forEach((e) => console.log(' - ' + e));
      console.log('FALHOU');
      tudoOk = false;
    } else {
      console.log(`OK (${m.larg}x${m.alt}, estrelas=${estrelas} perguntas=${perguntas} sacos=${sacos} inimigos=${inimigos} npcs=${npcs})`);
    }
  }

  return tudoOk;
}

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('uso: node tests/valida-fase.js <arquivo1.js> [arquivo2.js ...]');
  process.exit(1);
}

let ok = true;
for (const arq of args) {
  if (!validaArquivo(arq)) ok = false;
}

process.exit(ok ? 0 : 1);
