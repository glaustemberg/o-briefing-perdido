// Loja do Caju, fim de fase (adendo 3): entra entre "FASE CONCLUÍDA" e a volta à Seleção. Lista estática, só o
// cursor se move (spec 7). Um item por visita: comprou, sai. Confirmação trava por 200 ms (ruling do Berg,
// pré-voo): sem isso o Enter que fechou a fase compra sozinho o primeiro item da lista.
OBP.Shop = class extends Phaser.Scene {
  constructor() { super('Shop'); }
  init(data) { this.faseId = (data && data.fase) || 'fase-01'; }
  // lê o registry num objeto simples, que é o formato que OBP.Loja entende
  estado() {
    const r = this.registry;
    return {
      lampadas: r.get('lampadas'), coracoesMax: r.get('coracoesMax'), coracoesBase: OBP.dif(r).coracoes, coracoesExtra: r.get('coracoesExtra'),
      pulosExtra: r.get('pulosExtra'), itemGuardado: r.get('itemGuardado'),
    };
  }
  create() {
    const P = OBP.PAL;
    this.cameras.main.setBackgroundColor(P.pretoCamisa);
    this.sel = 0; this.comprando = false; this.avisoAte = 0;
    this.criadoEm = this.time.now; // trava de 200 ms do ruling do Berg
    this.add.text(320, 28, 'LOJA DO CAJU', OBP.estiloTexto(16, P.moeda)).setOrigin(0.5);
    // placa da loja é um dos lugares onde o roxo da marca é permitido (spec 2.7)
    this.add.rectangle(320, 28, 420, 32).setStrokeStyle(2, P.num(P.roxo));
    this.txtSaldo = this.add.text(320, 56, '', OBP.estiloTexto(8, P.cinzaClaro)).setOrigin(0.5);
    this.linhas = OBP.LOJA.map((it, i) => ({
      nome: this.add.text(120, 92 + i * 28, it.nome, OBP.estiloTexto(8, P.branco)).setOrigin(0, 0),
      preco: this.add.text(520, 92 + i * 28, String(it.preco), OBP.estiloTexto(8, P.moeda)).setOrigin(1, 0),
    }));
    this.txtSair = this.add.text(120, 92 + OBP.LOJA.length * 28, 'SAIR', OBP.estiloTexto(8, P.branco)).setOrigin(0, 0);
    this.cursor = this.add.image(84, 88, 'ui-seta').setOrigin(0, 0);
    this.txtResumo = this.add.text(320, 268, '', OBP.estiloTexto(8, P.cinzaClaro)).setOrigin(0.5);
    this.txtAviso = this.add.text(320, 292, '', OBP.estiloTexto(8, P.coracao)).setOrigin(0.5);
    this.add.text(320, 330, 'CIMA E BAIXO ESCOLHEM   ENTER CONFIRMA', OBP.estiloTexto(8, P.rim)).setOrigin(0.5);
    this.inp = new OBP.Input(this, ['cima', 'baixo', 'pulo']);
    OBP.Audio.init(this); OBP.Voice.init(this, this.registry.get('heroi'));
    this.atualizar();
  }
  atualizar() {
    const e = this.estado(), P = OBP.PAL;
    this.txtSaldo.setText(`LÂMPADAS ${String(Math.max(0, e.lampadas)).padStart(5, '0')}`);
    this.cursor.y = 88 + this.sel * 28;
    OBP.LOJA.forEach((it, i) => {
      const bloqueado = !!OBP.Loja.motivo(e, it.id);
      this.linhas[i].nome.setColor(i === this.sel ? P.moeda : (bloqueado ? P.rim : P.branco));
      this.linhas[i].preco.setColor(bloqueado ? P.rim : P.moeda);
    });
    this.txtSair.setColor(this.sel === OBP.LOJA.length ? P.moeda : P.branco);
    const it = OBP.LOJA[this.sel];
    this.txtResumo.setText(it ? it.resumo : 'VOLTA À SELEÇÃO SEM COMPRAR');
  }
  update(t) {
    if (this.avisoAte && t > this.avisoAte) { this.avisoAte = 0; this.txtAviso.setText(''); }
    if (this.comprando) return;
    const e = this.inp.ler(), n = OBP.LOJA.length;
    if (e.cima && !this.cimaAnt) { this.sel = (this.sel + n) % (n + 1); OBP.Audio.menuMover(); this.atualizar(); }
    if (e.baixo && !this.baixoAnt) { this.sel = (this.sel + 1) % (n + 1); OBP.Audio.menuMover(); this.atualizar(); }
    this.cimaAnt = e.cima; this.baixoAnt = e.baixo;
    if ((e.startAgora || e.puloAgora) && OBP.Loja.podeConfirmar(this.criadoEm, t)) this.confirmar(t);
  }
  confirmar(t) {
    if (this.sel === OBP.LOJA.length) { this.sair(); return; }
    const r = OBP.Loja.comprar(this.estado(), OBP.LOJA[this.sel].id);
    if (!r.ok) {
      this.txtAviso.setText(r.motivo); this.avisoAte = t + 900;
      OBP.Audio.dano();
      return;
    }
    this.comprando = true;
    this.registry.set(r.estado);
    OBP.Audio.compra(); OBP.Voice.falar('loja-01');
    this.txtAviso.setColor(OBP.PAL.verdeClaro).setText('COMPRADO');
    this.atualizar();
    this.time.delayedCall(700, () => this.sair());
  }
  // fim de fase leva à seguinte (decisão 67). Depois da última cai na Seleção com manter: true, que diz para não
  // zerar lâmpadas, vidas e bônus comprados (o reset é só de jogo novo).
  sair() {
    const prox = OBP.proximaFase(this.faseId);
    // depois da ultima fase o jogo FECHA numa tela de fim (decisao 82), em vez de voltar calado para a Selecao
    if (prox) this.scene.start('Level', { fase: prox });
    else this.scene.start('Fim');
  }
};
