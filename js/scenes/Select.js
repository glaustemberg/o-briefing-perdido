// Seleção (spec 7, versão M1): os dois idles em pedestal, setas escolhem, Enter, Z, espaço ou A confirmam.
OBP.Select = class extends Phaser.Scene {
  constructor() { super('Select'); }
  // manter: true chega da loja. Sem isso a Seleção zeraria as lâmpadas e o bônus recém-comprado no confirmar.
  init(data) { this.manter = !!(data && data.manter); }
  create() {
    const P = OBP.PAL;
    this.cameras.main.setBackgroundColor(P.pretoCamisa);
    this.add.text(320, 40, 'ESCOLHA SEU HERÓI', OBP.estiloTexto(16, P.branco)).setOrigin(0.5);
    this.ids = ['tikinho', 'gilpp']; this.sel = 0;
    this.cartas = this.ids.map((id, i) => {
      const x = 200 + i * 240, h = OBP.HEROIS[id];
      const moldura = this.add.rectangle(x, 190, 176, 220).setStrokeStyle(2, P.num(id === 'tikinho' ? P.petroleo : P.cinzaClaro));
      this.add.rectangle(x, 262, 112, 12, P.num(P.rim)).setOrigin(0.5, 0); // pedestal
      const spr = this.add.sprite(x, 262, id, 0).setOrigin(0.5, 1);
      const nome = this.add.text(x, 282, h.nome, OBP.estiloTexto(16, P.moeda)).setOrigin(0.5, 0);
      return { spr, nome, moldura };
    });
    this.add.text(320, 330, 'SETAS ESCOLHEM   ENTER CONFIRMA   ESPACO PULA   M SOCA', OBP.estiloTexto(8, P.cinzaClaro)).setOrigin(0.5);
    // gamepad só aparece depois de um botão apertado (política do navegador); no artifact pode ser barrado pelo iframe
    const gp = this.input.gamepad;
    this.txtPad = this.add.text(320, 346, gp && gp.total > 0 ? 'CONTROLE CONECTADO' : 'SEM CONTROLE: TECLADO OK', OBP.estiloTexto(8, OBP.PAL.cabeloGil)).setOrigin(0.5)  // rim (#5A5566) some no fundo escuro;
    if (gp) {
      const aoConectar = () => this.txtPad.setText('CONTROLE CONECTADO');
      gp.once('connected', aoConectar);
      this.events.once('shutdown', () => gp.off('connected', aoConectar));  // sem isto o ouvinte sobra no restart
    }
    this.inp = new OBP.Input(this);
    OBP.Audio.init(this);
    this.confirmado = false;
    this.atualizar();
  }
  atualizar() {
    this.cartas.forEach((c, i) => {
      const ativo = i === this.sel;
      c.moldura.setVisible(ativo);
      if (ativo) c.spr.clearTint(); else c.spr.setTint(OBP.PAL.num(OBP.PAL.rim));
    });
  }
  update() {
    const e = this.inp.ler();
    if (this.confirmado) return;
    if (e.esqAgora && this.sel > 0) { this.sel--; OBP.Audio.menuMover(); this.atualizar(); }
    if (e.dirAgora && this.sel < this.ids.length - 1) { this.sel++; OBP.Audio.menuMover(); this.atualizar(); }
    if (e.startAgora || e.puloAgora) {
      this.confirmado = true;
      const id = this.ids[this.sel];
      const base = { heroi: id, coracoes: this.registry.get('coracoesMax') || OBP.CFG.CORACOES };
      this.registry.set(this.manter ? base : Object.assign(base, {
        vidas: OBP.CFG.VIDAS, lampadas: 0, prazo: 0, coracoes: OBP.CFG.CORACOES,
        coracoesMax: OBP.CFG.CORACOES, coracoesExtra: 0, pulosExtra: 0, itemGuardado: null,
      }));
      OBP.Audio.menuConfirmar(); OBP.Voice.init(this, id); OBP.Voice.falar('sel-01');
      this.cartas.forEach((c, i) => { if (i !== this.sel) { c.spr.setTint(OBP.PAL.num(OBP.PAL.rim)); c.spr.y += 2; } });
      this.time.delayedCall(400, () => this.scene.start('Level', { fase: 'fase-01' }));
    }
  }
};
