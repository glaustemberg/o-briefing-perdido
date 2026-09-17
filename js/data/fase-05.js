// Fase 5: A Gráfica. Mapa 160x14 copiado da secao 5 da spec (legenda em Mapa.js, mais # e # de esteira).
// Esteira em trechos de 6 a 12 tiles. Ordem fixa do fim de fase: porta dos quatro roxos (col 150-153, mecanica
// de cor fora do ASCII) leva a sala do Seu Bira (col 154-158); a coxinha X so aparece depois do chefe, nunca antes.
// Revisao de design: os tres blocos de pergunta perderam o teto de apoio 1 tile acima do piso (fechava a
// passagem obrigatoria pra menos de 3 tiles livres); o pen drive recuou do buraco; a esteira reversa ganhou item.
window.OBP = window.OBP || {};
OBP.FASES = OBP.FASES || {};
OBP.FASES['fase-05'] = {
  nome: 'A GRÁFICA',
  inimigos: ['loira', 'abacaxi', 'nuvem'],   // decisao 67: os 3 slots so usam arquetipo implementado (os stubs do M3 nao nasciam e deixavam a fase vazia)
  // Bloco 1 (col 0-15): abertura, soco no piso solido, primeira impressora parada.
  // Bloco 2 (col 16-31): esteira de 10 tiles empurrando, plataforma one-way com estrelas.
  // Bloco 3 (col 32-47): Simone da a dica, guilhotina no ritmo fixo, primeiro bloco de pergunta flutuando livre.
  // Bloco 4 (col 48-63): pen drive recuado 3 colunas do buraco de 3 tiles, estrela bonus sobre o vao.
  // Bloco 5 (col 64-79): segundo bloco de pergunta, escada one-way ate duas estrelas no topo.
  // Bloco 6 (col 80-95): checkpoint, bolso reforcado que so o gilpp quebra, esteira reversa com saco no meio.
  // Bloco 7 (col 96-111): segunda guilhotina, terceiro bloco de pergunta, segundo buraco de 3 tiles.
  // Bloco 8 (col 112-127): segunda impressora, esteira longa de 12 tiles com estrelas por cima.
  // Bloco 9 (col 128-143): segundo pen drive, espinhos, carimbo no topo de outra escada one-way.
  // Bloco 10 (col 144-159): porta dos quatro roxos, sala do Seu Bira, coxinha X so depois do chefe vencido.
  mapa: [
    '...............................................................................................................................................................#',
    '...............................................................................................................................................................#',
    '...............................................................................................................................................................#',
    '...............................................................................................................................................................#',
    '...............................................................................................................................................................#',
    '...............................................................................................................................................................#',
    '...............................................................................................................................................................#',
    '...............................................................................................................................................................#',
    '..........................................................................**..$$....#####.......................................................A..............#',
    '.........***.........*.2*.....$$........................*.................==......=.R...#...............................*.*.*...................==.............#',
    '.....................====...................?.....................?.................*.$$#...............?......................................................#',
    '......................................................................==........=...*.$.#....$..............................................==....***..........#',
    '..P...$$2....1....................N.....2.2....3$.............2..............2..K...........2.......2...........$.1.2.............$$32..^^................$$..X#',
    '#######################################################..###################################################...#################################################',
  ],
};
