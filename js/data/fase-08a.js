// Fase 8a: A Torre, travessia do Capibaribe. Mapa 96x12 copiado da secao 5 da spec.
// Catamara automatico pulando as ondas do rio; sem checkpoint (trecho curto), o carimbo fica aqui e nao em 8b.
window.OBP = window.OBP || {};
OBP.FASES = OBP.FASES || {};
OBP.FASES['fase-08a'] = {
  nome: 'A TORRE: O CAPIBARIBE',
  inimigos: ['recepcionista', 'porta', 'template'],
  // Bloco 1 (col 0-15): embarque no catamara, primeiro template em dupla cai do drone de publicidade.
  // Bloco 2 (col 16-31): primeira onda, recepcionista do cais cobra credencial, primeiro bloco de pergunta.
  // Bloco 3 (col 32-47): comporta do rio fecha no ritmo, segunda onda.
  // Bloco 4 (col 48-63): terceira onda, segundo template em dupla, segundo bloco de pergunta.
  // Bloco 5 (col 64-79): segunda comporta, segundo recepcionista, carimbo no topo de uma escada one-way.
  // Bloco 6 (col 80-95): terceiro bloco de pergunta, Michel entrega o crache, saida para o elevador em 8b.
  mapa: [
    '...............................................................................................#',
    '...............................................................................................#',
    '...............................................................................................#',
    '...............................................................................................#',
    '...............................................................................................#',
    '...............................................................................................#',
    '...............................................................................................#',
    '.............................................................................A.................#',
    '.....***.....................$$.......**......***............$$.****........===................#',
    '............................?...............................?.......................?..........#',
    '..P...$$.$...3.$$........1.###.....2........$$...........3.###......2.$$..1.....$$.###..N.$.X..#',
    '####################...#################...#########...#########################################',
  ],
};
