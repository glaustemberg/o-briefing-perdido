// Fim de jogo (decisão 82). Antes, vencer o chefe na última fase devolvia o jogador para a tela de seleção sem
// uma palavra: o jogo simplesmente recomeçava. Aqui ele fecha. Mesma linguagem da capa (sala em luz roxa, placa,
// neon) para o começo e o fim se reconhecerem.
OBP.Fim = class extends Phaser.Scene {
  constructor() { super('Fim'); }

  create() {
    const P = OBP.PAL, r = this.registry;
    this.heroiId = r.get('heroi') || 'tikinho';
    this.cameras.main.setBackgroundColor(P.roxoSombra);

    if (this.textures.exists('fundo-fase-01')) {
      const alt = this.textures.get('fundo-fase-01').getSourceImage().height;
      this.fundo = this.add.tileSprite(0, 0, 640, 360, 'fundo-fase-01').setOrigin(0).setTint(P.num(P.roxoF5c));
      this.fundo.tilePositionY = Math.max(0, alt - 360);
    }
    this.add.rectangle(320, 322, 640, 76, P.num(P.roxoSombra));
    this.add.rectangle(320, 289, 640, 2, P.num(P.roxoBrilho));

    this.add.rectangle(320, 52, 640, 88, P.num(P.roxoSombra), 0.92);
    this.add.rectangle(320, 8, 640, 2, P.num(P.roxoBrilho));
    this.add.rectangle(320, 96, 640, 2, P.num(P.roxoBrilho));
    this.add.text(323, 43, 'BRIEFING ENTREGUE', OBP.estiloTexto(32, P.roxoF5a)).setOrigin(0.5);
    this.add.text(320, 40, 'BRIEFING ENTREGUE', OBP.estiloTexto(32, P.moeda)).setOrigin(0.5).setStroke(P.contorno, 4);
    this.add.text(320, 82, 'A TORRE ENTREGOU O JOB', OBP.estiloTexto(8, P.branco)).setOrigin(0.5);

    // o herói em pose de vitória, no mesmo chão da capa
    this.heroi = this.add.sprite(320, 288, this.heroiId, OBP.FRAMES.win).setOrigin(0.5, 1);
    this.add.ellipse(320, 289, 140, 24, P.num(P.roxoBrilho), 0.3).setDepth(-1);

    const pontos = r.get('lampadas') || 0;
    const recorde = OBP.Save.ler(OBP.CFG.FASE_FINAL, this.heroiId);
    const n = (v) => String(Math.max(0, v)).padStart(5, '0');
    this.add.text(320, 128, `PONTUAÇÃO ${n(pontos)}`, OBP.estiloTexto(16, P.moeda)).setOrigin(0.5).setStroke(P.contorno, 4);
    this.add.text(320, 156, `RECORDE ${n(recorde)}`, OBP.estiloTexto(8, P.branco)).setOrigin(0.5).setStroke(P.contorno, 4);
    this.add.text(320, 300, OBP.HEROIS[this.heroiId].nome, OBP.estiloTexto(16, P.branco)).setOrigin(0.5, 0).setStroke(P.contorno, 4);
    this.aperte = this.add.text(320, 340, 'APERTE START', OBP.estiloTexto(8, P.moeda)).setOrigin(0.5).setStroke(P.contorno, 4);

    this.faiscas = Array.from({ length: 14 }, () => {
      const f = this.add.rectangle(Phaser.Math.Between(8, 632), Phaser.Math.Between(120, 340), 2, 2,
        P.num(Phaser.Math.RND.pick([P.roxoBrilho, P.roxoF5d, P.moeda])));
      f.vy = Phaser.Math.FloatBetween(0.18, 0.5);
      return f;
    });

    this.inp = new OBP.Input(this);
    OBP.Audio.init(this); OBP.Voice.init(this, this.heroiId);
    OBP.Musica.tocar(this, 'mus-titulo', OBP.MIX.musicaTitulo);
    OBP.Voice.falar('vitchefe-01');
    this.proximoPiscar = 0; this.podeSair = false;
    this.time.delayedCall(1200, () => { this.podeSair = true; });   // sem isso o Enter que fechou a loja já sai
  }

  update(t) {
    if (this.fundo) this.fundo.tilePositionX += 0.1;
    for (const f of this.faiscas) { f.y -= f.vy; if (f.y < 108) { f.y = 300; f.x = Phaser.Math.Between(8, 632); } }
    if (t >= this.proximoPiscar) { this.aperte.setVisible(!this.aperte.visible); this.proximoPiscar = t + 500; }
    const e = this.inp.ler();
    if (this.podeSair && (e.startAgora || e.puloAgora || e.socoAgora)) {
      OBP.Musica.parar();
      this.scene.start('Select');    // jogo novo: a Seleção zera lâmpadas, vidas e bônus
    }
  }
};
