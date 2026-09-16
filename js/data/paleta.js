// Paleta mestre (spec 2.7): 32 cores do parecer 2 mais 4 roxos derivados da fase 5. Teto 48.
window.OBP = window.OBP || {};
OBP.PAL = {
  // neutros
  contorno: '#0D0B12', pretoCamisa: '#2B2735', rim: '#5A5566', cabeloGil: '#9A93A5', cinzaClaro: '#D8D2DE', branco: '#FAF6EE',
  // pele
  peleLuz: '#FFE6D5', pele: '#F2C9A0', peleMeio: '#D9995F', peleSombra: '#9E5A34',
  // terra
  terraEscura: '#6B3A22', terra: '#A9683B', areia: '#E0B48A',
  // quente
  vinho: '#8C1D1D', coracao: '#D63A2F', coral: '#F26A4A', laranja: '#F28B1E', moeda: '#FFCF3F', amareloClaro: '#FFF1A6',
  // verde
  verdeEscuro: '#1B4D2E', verde: '#2E8B57', verdeClaro: '#7ED957',
  // azul
  azulSombra: '#16324F', petroleo: '#2E6B7A', turquesa: '#37C6B3', azul: '#3F8FD6', ceu: '#8FD3F4',
  // frevo
  frevoEscuro: '#B0257A', frevo: '#F26A9E',
  // marca dot. (só sirene, wordmark, placa da loja e moldura do item)
  roxoSombra: '#3A1B5C', roxo: '#582C83', roxoBrilho: '#9C6DD6',
  // 4 roxos quase iguais da porta da fase 5, 10 pontos de valor entre eles; derivados de #582C83, conferir na fase 5
  roxoF5a: '#462369', roxoF5b: '#6A359D', roxoF5c: '#7A3DB6', roxoF5d: '#8C46D0',
};
OBP.PAL.num = hex => parseInt(hex.slice(1), 16);
OBP.PAL.lista = () => Object.values(OBP.PAL).filter(v => typeof v === 'string');
