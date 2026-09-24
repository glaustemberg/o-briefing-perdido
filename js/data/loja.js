// Loja do Caju, agora ANTES de cada fase (decisao 86, Berg: "a loja para entrar no inicio de cada fase para que a
// pessoa consiga comprar os poderes"). Preco em lampadas. Tres itens permanentes e quatro consumiveis: os
// consumiveis vao para o INVENTARIO e sao usados na fase com B (troca) e N (usa), como o menu de itens do Alex Kidd.
// Aqui so mora o que e calculavel, para o teste rodar sem Phaser e sem registry.
window.OBP = window.OBP || {};
OBP.LOJA = [
  { id: 'coracao',    nome: 'CORAÇÃO PERMANENTE', preco: 30, resumo: 'UM CORAÇÃO A MAIS, PARA SEMPRE' },
  { id: 'pulo-duplo', nome: 'PULO DUPLO',          preco: 15, resumo: 'SEGUNDO PULO NO AR, PARA SEMPRE' },
  { id: 'armadura',   nome: 'ARMADURA ROXA',       preco: 25, resumo: 'ATÉ O FIM DA FASE: 3 CORAÇÕES E TIRO', consumivel: true },
  { id: 'cafe',       nome: 'CAFÉ',                preco: 10, resumo: 'VELOCIDADE 1,4X POR 10 S', consumivel: true },
  { id: 'energetico', nome: 'ENERGÉTICO',          preco: 20, resumo: 'VELOCIDADE 1,4X POR 25 S', consumivel: true },
  { id: 'carimbo',    nome: 'CARIMBO APROVADO',    preco: 20, resumo: 'INVENCÍVEL POR 8 S', consumivel: true },
  { id: 'ctrlz',      nome: 'CTRL+Z',              preco: 40, resumo: 'DEVOLVE UM CORAÇÃO PERDIDO', consumivel: true },
];
// o que cada consumivel faz quando o heroi usa (N). ms: duracao do efeito; 'coracao' e 'armadura' (decisao 93,
// Berg: "pausa e uma animacao rapida") sao aplicados na hora, e a Cena por cima do Level so mostra o flourish.
OBP.EFEITOS = {
  cafe:       { tipo: 'velocidade', fator: 1.4, ms: 5000 },
  energetico: { tipo: 'velocidade', fator: 1.4, ms: 10000 },
  carimbo:    { tipo: 'invencivel', ms: 8000 },
  ctrlz:      { tipo: 'coracao' },      // devolve 1 coracao; usa com N como os outros (decisao 93)
  armadura:   { tipo: 'armadura' },     // veste a armadura ate o fim da fase (Level.concluir zera coracoesExtra)
};
OBP.Loja = {
  MAX_POR_ITEM: 3,   // teto por consumivel no inventario
  item(id) { return OBP.LOJA.find(i => i.id === id) || null; },
  // estado: { lampadas, coracoesMax, coracoesBase, coracoesExtra, pulosExtra, inventario }. coracoesBase e o da
  // dificuldade. Devolve null quando pode comprar, ou o texto em caixa alta que a cena imprime embaixo da lista.
  motivo(estado, id) {
    const it = this.item(id);
    if (!it) return 'ITEM DESCONHECIDO';
    if (estado.lampadas < it.preco) return 'LÂMPADAS DE MENOS';
    if (id === 'coracao' && estado.coracoesMax > (estado.coracoesBase || OBP.CFG.CORACOES)) return 'JÁ TEM';
    if (id === 'pulo-duplo' && estado.pulosExtra > 0) return 'JÁ TEM';
    if (it.consumivel && (estado.inventario || []).filter(x => x === id).length >= this.MAX_POR_ITEM) return `JÁ TEM ${this.MAX_POR_ITEM}`;
    return null;
  },
  comprar(estado, id) {
    const motivo = this.motivo(estado, id);
    if (motivo) return { ok: false, motivo, estado };
    const it = this.item(id), n = Object.assign({}, estado, { inventario: [...(estado.inventario || [])] });
    n.lampadas = estado.lampadas - it.preco;
    if (id === 'coracao') n.coracoesMax = estado.coracoesMax + 1;
    else if (id === 'pulo-duplo') n.pulosExtra = 1;
    else n.inventario.push(id);
    return { ok: true, motivo: null, estado: n };
  },
  // ruling do Berg (pré-voo, 16/09): a loja não aceita confirmação nos primeiros 200 ms depois de abrir, senão o
  // Enter que fechou "FASE CONCLUÍDA" compra sozinho o primeiro item. Pura para o teste cobrir sem Phaser.
  podeConfirmar(criadoEm, agora) { return agora - criadoEm >= 200; },
};
// Inventario em jogo: lista de ids (repetidos contam como unidades) e um indice selecionado. O HUD mostra o
// selecionado com a quantidade; B avanca para o proximo id DIFERENTE, N consome uma unidade do selecionado.
OBP.Inventario = {
  // so os itens que se usam com N: o Ctrl+Z e passivo e fica de fora do ciclo
  ativos(inv) { return (inv || []).filter(id => !(OBP.EFEITOS[id] && OBP.EFEITOS[id].passivo)); },
  // ids distintos na ordem em que apareceram, com a contagem
  resumo(inv) {
    const ordem = [];
    inv = this.ativos(inv);
    for (const id of inv || []) if (!ordem.includes(id)) ordem.push(id);
    return ordem.map(id => ({ id, n: inv.filter(x => x === id).length }));
  },
  selecionado(inv, sel) { const r = this.resumo(inv); return r.length ? r[sel % r.length] : null; },
  proximo(inv, sel) { const n = this.resumo(inv).length; return n ? (sel + 1) % n : 0; },
  quantos(inv, id) { return (inv || []).filter(x => x === id).length; },
  // tira uma unidade de um id qualquer (o Ctrl+Z na morte usa isto); null se nao tem
  gastar(inv, id) { const i = (inv || []).indexOf(id); return i < 0 ? null : inv.slice(0, i).concat(inv.slice(i + 1)); },
  // devolve null sem item; senao { id, inventario, sel } com uma unidade a menos e a selecao ajustada
  usar(inv, sel) {
    const s = this.selecionado(inv, sel);
    if (!s) return null;
    const i = inv.indexOf(s.id), novo = inv.slice(0, i).concat(inv.slice(i + 1));
    const n = this.resumo(novo).length;
    return { id: s.id, inventario: novo, sel: n ? Math.min(sel, n - 1) : 0 };
  },
};
