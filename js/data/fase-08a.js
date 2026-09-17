// Fase 8a: A Torre, travessia do Capibaribe. Mapa 96x12 copiado da secao 5 da spec.
// Revisao de design: a recepcionista some daqui, ela so faz sentido depois que o Michel entrega o crache
// (aqui, no bloco 6); com rolagem automatica ninguem pode ficar preso num gate sem o item ainda. As 5 ondas
// variam de largura (3, 4, 5, 3, 4) pra nao repetir sempre o mesmo pulo. Sem checkpoint, o carimbo fica aqui.
window.OBP = window.OBP || {};
OBP.FASES = OBP.FASES || {};
OBP.FASES['fase-08a'] = {
  nome: 'A TORRE: O CAPIBARIBE',
  inimigos: ['abacaxi', 'nuvem', 'loira'],   // decisao 67: os 3 slots so usam arquetipo implementado (os stubs do M3 nao nasciam e deixavam a fase vazia)
  // Bloco 1 (col 0-15): embarque no catamara, estrelas 4 a 6 colunas depois do P, primeiro template em dupla.
  // Bloco 2 (col 16-31): onda de 3 tiles, comporta afastada 5 colunas do pouso (sem desvio, ciclo sincronizado ao passo automatico do catamara, sempre da tempo), primeiro bloco de pergunta.
  // Bloco 3 (col 32-47): onda de 4 tiles, segundo template em dupla, estrelas.
  // Bloco 4 (col 48-63): onda de 5 tiles (a maior do trecho), segunda comporta (mesma sincronia da primeira), segundo bloco de pergunta.
  // Bloco 5 (col 64-79): onda de 3 tiles, terceiro template em dupla, carimbo no topo de escada one-way.
  // Bloco 6 (col 80-95): terceiro bloco de pergunta, onda de 4 tiles, terceira comporta sincronizada, Michel entrega o crache antes da saida para 8b.
  mapa: [
    '...............................................................................................#',
    '...............................................................................................#',
    '...............................................................................................#',
    '...............................................................................................#',
    '...............................................................................................#',
    '...............................................................................................#',
    '...............................................................................................#',
    '...............................................................................................#',
    '......***.....................$$.***.......$.$.***...............***.........A.....$...........#',
    '.............................?................................?.............===..?.............#',
    '..P..$....$..3.$$.......$..2###.............3..............$2###$......$$.3.....###.....$$2.N.X#',
    '####################...##############....############.....##########...#############....########',
  ],
};
