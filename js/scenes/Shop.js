// Copa do Caju (decisao 86): a loja abre ANTES de cada fase e e um LUGAR, a copa da agencia, com os itens nas
// prateleiras e a porta da fase a direita. Comprar e como no Alex Kidd: o heroi anda ate ficar embaixo do item e
// PULA; no apice o item voa para ele. Direcao fechada a partir dos tres pareceres: o comodo com prateleiras e
// porta (ui-styling), a compra por pulo e a recusa com som proprio (genjutsu), os estados de item explicitos e o
// aviso do que falta antes de tentar (impeccable). Compra quantos quiser; a porta comeca a fase.
OBP.Shop = class extends Phaser.Scene {
  constructor() { super('Shop'); }
  init(data) { this.faseId = (data && data.fase) || 'fase-01'; }
  // le o registry num objeto simples, que e o formato que OBP.Loja entende
  estado() {
    const r = this.registry;
    return {
      lampadas: r.get('lampadas'), coracoesMax: r.get('coracoesMax'), coracoesBase: OBP.dif(r).coracoes, coracoesExtra: r.get('coracoesExtra'),
      pulosExtra: r.get('pulosExtra'), inventario: r.get('inventario') || [],
    };
  }
  create() {
    const P = OBP.PAL, fase = OBP.FASES[this.faseId], n = OBP.ORDEM.indexOf(this.faseId) + 1;
    this.heroiId = this.registry.get('heroi') || 'tikinho';
    if (this.textures.exists('fundo-copa')) this.add.image(0, 0, 'fundo-copa').setOrigin(0);
    else this.cameras.main.setBackgroundColor(P.areia);

    // faixa do topo: placa da copa (o roxo da marca), o que esta selecionado no centro, o saldo a direita
    this.add.rectangle(320, 32, 640, 64, P.num(P.contorno), 0.82);
    this.add.rectangle(88, 32, 152, 40, P.num(P.roxoSombra)).setStrokeStyle(2, P.num(P.roxoBrilho));
    this.add.text(88, 32, 'COPA DO\nCAJU', OBP.estiloTexto(8, P.moeda)).setOrigin(0.5).setAlign('center');
    this.txtNome = this.add.text(336, 22, '', OBP.estiloTexto(16, P.branco)).setOrigin(0.5).setStroke(P.contorno, 4);
    this.txtResumo = this.add.text(336, 46, '', OBP.estiloTexto(8, P.cinzaClaro)).setOrigin(0.5);
    this.add.image(520, 16, 'item-lampada').setOrigin(0, 0);
    this.txtSaldo = this.add.text(632, 24, '', OBP.estiloTexto(16, P.moeda)).setOrigin(1, 0);

    // itens nas duas prateleiras do fundo: permanentes em cima, consumiveis embaixo, repartidos por igual ao longo
    // da madeira (as duas prateleiras do copa.png vao de x 77 a 352). Berg, decisao 93: "ficou desorganizado os
    // itens", quando o Ctrl+Z virou consumivel e caiu fora da prateleira. A porta e o ultimo lugar.
    const cima = OBP.LOJA.filter(i => !i.consumivel), baixo = OBP.LOJA.filter(i => i.consumivel);
    const fileira = (lista, y) => lista.map((it, i) => ({ it, x: Math.round(77 + (i + 0.5) * 275 / lista.length), y }));
    this.lugares = [...fileira(cima, 84), ...fileira(baixo, 149), { it: null, x: 565, y: 240 }];
    this.cartoes = this.lugares.map(l => {
      if (!l.it) {
        const placa = this.add.rectangle(l.x, 150, 72, 20, P.num(P.contorno), 0.85);
        const txt = this.add.text(l.x, 150, `FASE ${n}`, OBP.estiloTexto(8, P.moeda)).setOrigin(0.5);
        return { moldura: this.add.rectangle(l.x, 240, 96, 180).setStrokeStyle(2, P.num(P.moeda)).setVisible(false), placa, txt };
      }
      const icone = this.add.image(l.x, l.y, this.textures.exists('item-' + l.it.id) ? 'item-' + l.it.id : 'item-lampada').setOrigin(0.5);
      const preco = this.add.text(l.x, l.y + 24, '', OBP.estiloTexto(8, P.moeda)).setOrigin(0.5, 0).setStroke(P.contorno, 3);
      const qtd = this.add.text(l.x + 18, l.y + 16, '', OBP.estiloTexto(8, P.branco)).setOrigin(1, 1).setStroke(P.contorno, 3);
      const moldura = this.add.rectangle(l.x, l.y, 44, 44).setStrokeStyle(2, P.num(P.moeda)).setVisible(false);
      return { icone, preco, qtd, moldura };
    });

    // o heroi escolhido, em pe no chao da copa, anda em passos inteiros ate o lugar escolhido
    this.chao = 330;
    this.heroi = this.add.sprite(this.lugares[0].x, this.chao, this.heroiId, OBP.FRAMES.idle).setOrigin(0.5, 1);
    this.sel = 0; this.alvoX = this.lugares[0].x; this.pulo = null; this.passo = 0;
    this.rodape = this.add.text(320, 344, OBP.Toque.ativo
      ? 'TOQUE < > PARA ANDAR   PULO COMPRA   NA FASE: TROCA E USA'
      : 'SETAS ANDAM   ESPAÇO COMPRA   NA FASE: B TROCA O ITEM, N USA', OBP.estiloTexto(8, P.branco)).setOrigin(0.5).setStroke(P.contorno, 4);
    this.txtAviso = this.add.text(320, 300, '', OBP.estiloTexto(8, P.coracao)).setOrigin(0.5).setStroke(P.contorno, 4);
    this.avisoAte = 0; this.criadoEm = this.time.now; this.falou = false; this.saindo = false;   // BUG ate a decisao 93: sem zerar, a porta nao abria na segunda copa

    this.inp = new OBP.Input(this, ['esq', 'dir', 'pulo']);
    OBP.Audio.init(this); OBP.Voice.init(this, this.heroiId);
    // o gilpp responde ao tikinho na primeira copa da partida (gp-sel-02 nunca tocava, revisao 21b)
    if (this.heroiId === 'gilpp' && this.faseId === OBP.ORDEM[0]) this.time.delayedCall(1400, () => OBP.Voice.falar('sel-02'));
    this.atualizar();
    this.cameras.main.fadeIn(250, 0, 0, 0);
  }

  atualizar() {
    const e = this.estado(), P = OBP.PAL, inv = e.inventario;
    this.txtSaldo.setText(String(Math.max(0, e.lampadas)).padStart(5, '0'));
    this.lugares.forEach((l, i) => {
      const c = this.cartoes[i], on = i === this.sel;
      c.moldura.setVisible(on);
      if (!l.it) return;
      const motivo = OBP.Loja.motivo(e, l.it.id), tem = OBP.Inventario.quantos(inv, l.it.id);
      c.icone.clearTint();
      if (motivo && motivo.startsWith('JÁ TEM')) { c.preco.setText('TEM').setColor(P.verdeClaro); }
      else if (motivo) { c.preco.setText(String(l.it.preco)).setColor(P.cinzaClaro); c.icone.setTint(P.num(P.rim)); }
      else c.preco.setText(String(l.it.preco)).setColor(P.moeda);
      c.qtd.setText(tem > 0 ? 'x' + tem : '');
    });
    const l = this.lugares[this.sel];
    if (l.it) {
      const motivo = OBP.Loja.motivo(e, l.it.id);
      this.txtNome.setText(l.it.nome).setColor(P.branco);
      const falta = e.lampadas < l.it.preco ? `FALTAM ${l.it.preco - e.lampadas} LÂMPADAS` : '';
      this.txtResumo.setText(motivo && !motivo.startsWith('JÁ TEM') ? falta || motivo : l.it.resumo);
    } else {
      const f = OBP.FASES[this.faseId];
      this.txtNome.setText(f ? f.nome : this.faseId).setColor(P.moeda);
      this.txtResumo.setText(`PULO ABRE A PORTA   PRAZO ${OBP.Relogio.formatar(Math.round((OBP.PRAZOS[this.faseId] || 180) * OBP.dif(this.registry).prazo))}`);
    }
  }

  mover(d) {
    const novo = Phaser.Math.Clamp(this.sel + d, 0, this.lugares.length - 1);
    if (novo === this.sel) return;
    this.sel = novo; this.alvoX = this.lugares[novo].x;
    this.heroi.setFlipX(d < 0); OBP.Audio.menuMover();
    this.atualizar();
  }

  update(t) {
    if (this.avisoAte && t > this.avisoAte) { this.avisoAte = 0; this.txtAviso.setText(''); }
    const e = this.inp.ler(), F = OBP.FRAMES;
    // anda em passos de 8 px por quadro, sempre em pixel inteiro; troca de perna a cada 6 quadros
    if (!this.pulo && this.heroi.x !== this.alvoX) {
      const d = Math.sign(this.alvoX - this.heroi.x);
      this.heroi.x = Math.abs(this.alvoX - this.heroi.x) <= 8 ? this.alvoX : this.heroi.x + d * 8;
      this.heroi.setFrame((Math.floor(++this.passo / 6) % 2) ? F.walk1 : F.walk3);
      if (this.heroi.x === this.alvoX) this.heroi.setFrame(F.idle);
    }
    if (this.pulo) {
      // pulo de 12 quadros: sobe 6, desce 6, o apice e a compra
      this.pulo.f++;
      const f = this.pulo.f, dy = f <= 6 ? -f * 4 : -(12 - f) * 4;
      this.heroi.y = this.chao + dy; this.heroi.setFrame(f <= 6 ? F.jump : F.fall);
      if (f === 6) this.comprar(t);
      if (f >= 12) { this.pulo = null; this.heroi.y = this.chao; this.heroi.setFrame(F.idle); }
      return;
    }
    if (e.esqAgora) this.mover(-1);
    if (e.dirAgora) this.mover(1);
    if ((e.puloAgora || e.startAgora) && OBP.Loja.podeConfirmar(this.criadoEm, t) && this.heroi.x === this.alvoX) {
      if (!this.lugares[this.sel].it) return this.sair();
      this.pulo = { f: 0 }; OBP.Audio.pulo();
    }
  }

  comprar(t) {
    const l = this.lugares[this.sel], c = this.cartoes[this.sel], P = OBP.PAL;
    const r = OBP.Loja.comprar(this.estado(), l.it.id);
    if (!r.ok) {
      // recusa: o item treme e um som seco, nunca o de apanhar (parecer 3)
      this.txtAviso.setText(r.motivo).setColor(P.coracao); this.avisoAte = t + 900;
      OBP.Audio.recusa();
      this.tweens.add({ targets: c.icone, x: l.x + 2, duration: 33, yoyo: true, repeat: 3, onComplete: () => { c.icone.x = l.x; } });
      return;
    }
    this.registry.set(r.estado);
    OBP.Audio.compra();
    OBP.Voice.falar('loja-' + ({ 'pulo-duplo': 'pulo' }[l.it.id] || l.it.id));   // uma fala por item (decisao 93)
    // o item voa da prateleira ate o heroi e some; a prateleira continua com o item (a copa nao esvazia)
    const voa = this.add.image(l.x, l.y, c.icone.texture.key).setOrigin(0.5);
    this.tweens.add({ targets: voa, x: this.heroi.x, y: this.chao - 60, duration: 200, onComplete: () => voa.destroy() });
    this.txtAviso.setText('COMPRADO').setColor(P.verdeClaro); this.avisoAte = t + 700;
    this.atualizar();
  }

  // a porta da fase: fade e comeca
  sair() {
    if (this.saindo) return;
    this.saindo = true; OBP.Audio.menuConfirmar();
    this.cameras.main.fadeOut(250, 0, 0, 0);
    this.time.delayedCall(260, () => this.scene.start('Level', { fase: this.faseId }));
  }
};
