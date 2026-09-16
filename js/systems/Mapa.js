// Parser puro do mapa ASCII (spec 9): cada string é uma linha; LEG vira índice do tileset, o resto vira -1;
// caracteres de entidade voltam numa lista para o Level instanciar sprites em (col*32, lin*32).
window.OBP = window.OBP || {};
OBP.Mapa = {
  LEG: { '#': 0, '=': 1, '*': 2, '?': 3, 'R': 4, '^': 5 },
  USADO: 6,
  ENTIDADES: 'PKXNA$o123D',
  parse(linhas) {
    if (!Array.isArray(linhas) || linhas.length === 0) throw new Error('mapa: sem linhas');
    const larg = linhas[0].length, alt = linhas.length;
    const dados = [], entidades = [];
    linhas.forEach((l, lin) => {
      if (l.length !== larg) throw new Error(`mapa: linha ${lin} tem largura ${l.length}, esperado ${larg}`);
      const fila = [];
      [...l].forEach((ch, col) => {
        fila.push(ch in this.LEG ? this.LEG[ch] : -1);
        if (this.ENTIDADES.includes(ch)) entidades.push({ ch, col, lin });
      });
      dados.push(fila);
    });
    if (!entidades.some(e => e.ch === 'P')) throw new Error('mapa: falta o P de início');
    return { larg, alt, dados, entidades };
  },
};
