#!/usr/bin/env node
// Trava simples: todo .js do jogo e o script inline de tests/teste.html precisam parsear.
// Existe porque resolver conflito de merge na mao ja comeu chave de fechamento tres vezes,
// e o sintoma e mudo: a pagina de teste abre vazia e o jogo carrega a metade dos arquivos.
const fs = require('fs'), path = require('path');
const raiz = path.join(__dirname, '..');
let erros = 0;
const anda = d => fs.readdirSync(d, { withFileTypes: true }).forEach(e => {
  const p = path.join(d, e.name);
  if (e.isDirectory()) return anda(p);
  if (!e.name.endsWith('.js')) return;
  try { new Function(fs.readFileSync(p, 'utf8')); }
  catch (err) { console.log(`QUEBRADO ${path.relative(raiz, p)}: ${err.message}`); erros++; }
});
anda(path.join(raiz, 'js'));
const html = fs.readFileSync(path.join(raiz, 'tests', 'teste.html'), 'utf8');
[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].forEach((m, i) => {
  try { new Function(m[1]); }
  catch (err) { console.log(`QUEBRADO tests/teste.html bloco ${i}: ${err.message}`); erros++; }
});
const marcas = [...html.matchAll(/^(<{7}|={7}|>{7})/gm)].length;
if (marcas) { console.log(`sobraram ${marcas} marcadores de conflito`); erros++; }
console.log(erros ? `${erros} arquivo(s) com problema` : 'tudo parseia');
process.exit(erros ? 1 : 0);
