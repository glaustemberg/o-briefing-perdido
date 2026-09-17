// HUD (spec 2.11 mais adendo 1 e 2, layout em OBP.CFG.HUD): corações 18x16 com vão 2 em (16,16); ícone de lâmpada
// 32x32 e 5 dígitos com a borda direita em x = 304; slot do item 36x36 em (588,16) com a única moldura roxa do jogo.
// Roda em paralelo ao Level.
OBP.Hud = class extends Phaser.Scene {
  constructor() { super('Hud'); }
  static criarTexturas(scene) {
    const P = OBP.PAL;
    // coração cheio e vazio vêm do Boot (item-coracao, item-coracao-vazio); só o extra da armadura nasce por
    // código, porque não existe arte carregada pra ele: os roxos da marca valem aqui (item 8 do adendo).
    OBP.pixels(scene, 'coracao-extra', [
      '..#####...#####...',
      '.#oo####.#######..',
      '#o#############o#.',
      '#################.',
      '#################.',
      '#################.',
      '.###############..',
      '..#############...',
      '...###########....',
      '....#########.....',
      '.....#######......',
      '......#####.......',
      '.......###........',
      '........#.........',
      '..................',
      '..................',
    ], { '#': P.roxoBrilho, 'o': P.branco });
  }
  create() {
    OBP.Hud.criarTexturas(this);
    const P = OBP.PAL, H = OBP.CFG.HUD;
    this.coracoes = [];
    this.add.image(H.LAMPADA_ICONE_X, H.Y, 'item-lampada').setOrigin(0, 0);
    this.txtLampadas = this.add.text(H.LAMPADA_DIG_DIR, H.Y, '00000', OBP.estiloTexto(16, P.moeda)).setOrigin(1, 0);
    this.add.image(H.RELOGIO_ICONE_X, H.Y, 'item-relogio').setOrigin(0, 0);
    this.txtPrazo = this.add.text(H.PRAZO_DIG_DIR, H.Y, '00:00', OBP.estiloTexto(16, P.branco)).setOrigin(1, 0);
    const g = this.add.graphics();
    g.fillStyle(P.num(P.roxo)); g.fillRect(588, 16, 36, 36);
    g.fillStyle(P.num(P.roxoBrilho)); g.fillRect(590, 18, 32, 32);
    g.fillStyle(P.num(P.pretoCamisa)); g.fillRect(591, 19, 30, 30);
    this.desenharCoracoes();
    this.mostrarLampadas(this.registry.get('lampadas'));
    const aoCoracao = () => this.desenharCoracoes(), aoLampada = (_p, v) => this.mostrarLampadas(v, true);
    const aoPrazo = (_p, v) => this.mostrarPrazo(v);
    this.mostrarPrazo(this.registry.get('prazo'));
    this.registry.events.on('changedata-coracoes', aoCoracao);
    this.registry.events.on('changedata-coracoesExtra', aoCoracao);
    this.registry.events.on('changedata-coracoesMax', aoCoracao);
    this.registry.events.on('changedata-lampadas', aoLampada);
    this.registry.events.on('changedata-prazo', aoPrazo);
    this.events.once('shutdown', () => {
      this.registry.events.off('changedata-coracoes', aoCoracao);
      this.registry.events.off('changedata-coracoesExtra', aoCoracao);
      this.registry.events.off('changedata-coracoesMax', aoCoracao);
      this.registry.events.off('changedata-lampadas', aoLampada);
      this.registry.events.off('changedata-prazo', aoPrazo);
    });
  }
  // até 4 normais (3 mais o coração permanente da loja) e até 3 extras da armadura: 7 no total, 16 + 7x20 = 156 px
  desenharCoracoes() {
    const H = OBP.CFG.HUD;
    const n = this.registry.get('coracoes'), max = this.registry.get('coracoesMax') || OBP.CFG.CORACOES;
    const extra = this.registry.get('coracoesExtra') || 0;
    this.coracoes.forEach(c => c.destroy());
    this.coracoes = [];
    const por = (i, chave) => this.coracoes.push(this.add.image(H.CORACAO_X + i * H.CORACAO_VAO, H.Y, chave).setOrigin(0, 0));
    for (let i = 0; i < max; i++) por(i, i < n ? 'item-coracao' : 'item-coracao-vazio');
    for (let i = 0; i < extra; i++) por(max + i, 'coracao-extra');
  }
  // nudge de 2 px por 2 f (33 ms) a cada coleta (spec 4, agora em lâmpadas)
  mostrarLampadas(v, nudge = false) {
    this.txtLampadas.setText(String(Math.max(0, v)).padStart(5, '0'));
    if (nudge) { this.txtLampadas.y = OBP.CFG.HUD.Y + 2; this.time.delayedCall(33, () => { this.txtLampadas.y = OBP.CFG.HUD.Y; }); }
  }
  // branco enquanto sobra prazo, vermelho no overtime: o texto nunca some, so troca de cor
  mostrarPrazo(seg) {
    if (!this.txtPrazo) return;
    this.txtPrazo.setText(OBP.Relogio.formatar(seg || 0));
    this.txtPrazo.setColor(OBP.Relogio.atrasado(seg || 0) ? OBP.PAL.coracao : OBP.PAL.branco);
  }
};
