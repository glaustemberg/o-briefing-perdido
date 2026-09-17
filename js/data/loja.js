// Loja de fim de fase (adendo 3). Preço em lâmpadas. Um item por visita é regra da cena, não desta tabela:
// aqui só mora o que é calculável, para o teste rodar sem Phaser e sem registry.
window.OBP = window.OBP || {};
OBP.LOJA = [
  { id: 'coracao',    nome: 'CORAÇÃO PERMANENTE', preco: 30, resumo: 'UM CORAÇÃO A MAIS, PARA SEMPRE' },
  { id: 'pulo-duplo', nome: 'PULO DUPLO',          preco: 15, resumo: 'SEGUNDO PULO NO AR, SÓ NA PRÓXIMA FASE' },
  { id: 'armadura',   nome: 'ARMADURA ROXA',       preco: 25, resumo: 'TRÊS CORAÇÕES EXTRAS E TIRO' },
  { id: 'cafe',       nome: 'CAFÉ',                preco: 10, resumo: 'VELOCIDADE 1,4X POR 10 S' },
  { id: 'energetico', nome: 'ENERGÉTICO',          preco: 20, resumo: 'VELOCIDADE 1,4X POR 25 S' },
];
OBP.Loja = {
  item(id) { return OBP.LOJA.find(i => i.id === id) || null; },
  // estado: { lampadas, coracoesMax, coracoesExtra, pulosExtra, itemGuardado }. Devolve null quando pode comprar,
  // ou o texto em caixa alta que a cena imprime embaixo da lista.
  motivo(estado, id) {
    const it = this.item(id);
    if (!it) return 'ITEM DESCONHECIDO';
    if (estado.lampadas < it.preco) return 'LÂMPADAS DE MENOS';
    if (id === 'coracao' && estado.coracoesMax > OBP.CFG.CORACOES) return 'JÁ TEM';
    if (id === 'pulo-duplo' && estado.pulosExtra > 0) return 'JÁ TEM';
    if (id === 'armadura' && estado.coracoesExtra > 0) return 'JÁ TEM';
    if ((id === 'cafe' || id === 'energetico') && estado.itemGuardado) return 'SLOT OCUPADO';
    return null;
  },
  comprar(estado, id) {
    const motivo = this.motivo(estado, id);
    if (motivo) return { ok: false, motivo, estado };
    const it = this.item(id), n = Object.assign({}, estado);
    n.lampadas = estado.lampadas - it.preco;
    if (id === 'coracao') n.coracoesMax = estado.coracoesMax + 1;
    else if (id === 'pulo-duplo') n.pulosExtra = 1;
    else if (id === 'armadura') n.coracoesExtra = OBP.CFG.CORACOES_ARMADURA || 3;
    else n.itemGuardado = id;
    return { ok: true, motivo: null, estado: n };
  },
  // ruling do Berg (pré-voo, 16/09): a loja não aceita confirmação nos primeiros 200 ms depois de abrir, senão o
  // Enter que fechou "FASE CONCLUÍDA" compra sozinho o primeiro item. Pura para o teste cobrir sem Phaser.
  podeConfirmar(criadoEm, agora) { return agora - criadoEm >= 200; },
};
