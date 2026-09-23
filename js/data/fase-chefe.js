// Arena do chefe (decisao 85): a sala de reuniao no topo da torre, uma tela so, 20x11 tiles, fechada dos dois
// lados. Nao tem saida X: a fase termina quando o Sobrinho cai. O herói nasce a esquerda e o Sobrinho e posto
// pelo Level a direita (coluna 15), sem marca no mapa, porque ele nao e um dos 3 slots de inimigo.
// O mapa tem 11 linhas (352 px) de proposito: o chao fica na linha 10 e sobra a faixa do carpete do fundo.
window.OBP = window.OBP || {};
OBP.FASES = OBP.FASES || {};
OBP.FASES['chefe'] = {
  nome: 'REUNIÃO DE APROVAÇÃO',
  inimigos: ['abacaxi', 'nuvem', 'loira'],   // slots exigidos pelo teste; a arena nao usa marca 1, 2 ou 3
  mapa: [
    '#..................#',
    '#..................#',
    '#..................#',
    '#..................#',
    '#..................#',
    '#..................#',
    '#..................#',
    '#..................#',
    '#..................#',
    '#..P...............#',
    '####################',
  ],
};
