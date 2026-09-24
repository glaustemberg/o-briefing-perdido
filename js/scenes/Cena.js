// Cena: abre por cima do Level pausado quando o heroi usa um consumivel com N (Level.usarItem, decisao 93, Berg:
// "pausa no jogo e aparece uma animacao rapida no estilo de grafico do jogo mesmo onde eles consomem o item, bem
// rapidos e acelerados para nao perder tempo"). Mesmo padrao do Boss.js: o Level so pausa (fica em cena, so nao
// atualiza), e ao fechar a Cena retoma o Level e reaponta audio e voz pra ele, senao o canal errado fica mudo
// (achado do proprio Boss.js: "senao a luta inteira toca bipe"). So retangulos, sprites e texto: sem rotacao fora
// de 90 graus, que e o que a regra 2.3 (sem anti-aliasing) proibe nos blocos.
OBP.Cena = class extends Phaser.Scene {
  constructor() { super('Cena'); }
  init(data) { this.tipo = data.tipo; this.heroiId = data.heroi || this.registry.get('heroi') || 'tikinho'; }   // o heroi vem do registry, como nas outras cenas
  create() {
    const P = OBP.PAL;
    this.L = this.scene.get('Level');
    OBP.Audio.init(this); OBP.Voice.init(this, this.heroiId);
    this.terminado = false;
    // qualquer tecla ou toque pula direto pro fim (Berg: "bem rapidos e acelerados")
    this.input.keyboard.once('keydown', () => this.terminar());
    this.input.once('pointerdown', () => this.terminar());

    // video feito no Magnific (decisao 93, Berg: "os videos animados de consumo dos itens devem ser feitos usando
    // ferramentas do magnific"): Seedance 2.5 entre dois quadros desta mesma cena desenhada, acelerado e pixelado de
    // volta a 640x360 pelo 03-assets/_scripts/pixela_video.py. Sem o video (offline, 404), vale a cena desenhada abaixo.
    this.tocarVideo(this.heroiId + '-' + this.tipo);
  }
  desenhar() {
    const P = OBP.PAL;
    OBP.Blocos.criarTexturas(this);   // 'estrela32': o ctrlz explode o monitor nos mesmos pedacos do bloco
    this.add.rectangle(320, 180, 640, 360, P.num(P.contorno), 0.85);
    this.heroi = this.add.sprite(320, 280, this.heroiId, OBP.FRAMES.idle).setOrigin(0.5, 1).setScale(2).setDepth(10);
    this.time.delayedCall(OBP.Cena.DURACAO[this.tipo] || 1400, () => this.terminar());

    const abrir = { cafe: () => this.cafeEnergetico('cafe'), energetico: () => this.cafeEnergetico('energetico'),
      ctrlz: () => this.ctrlz(), armadura: () => this.armadura(), carimbo: () => this.carimbo() }[this.tipo];
    if (abrir) abrir();
  }
  update(t) { OBP.Pedacos.update(this, t); }
  tocarVideo(chave) {
    const url = OBP.VIDEOS && OBP.VIDEOS[chave];   // blob baixado pelo Boot
    if (!url) return this.desenhar();
    this.add.rectangle(320, 180, 640, 360, OBP.PAL.num(OBP.PAL.contorno), 0.85);
    const v = this.add.video(320, 180).setDepth(30);   // o mp4 ja vem em 640x360
    v.once('complete', () => this.terminar());
    const cair = () => { if (!this.terminado) { v.destroy(); this.desenhar(); } };
    v.once('error', cair); v.once('unsupported', cair);
    v.loadURL(url, true); v.play();
    this.time.delayedCall(3500, () => this.terminar());   // seguranca: nenhum video passa de 2,5 s
    if (this.tipo === 'armadura') {   // a marca da dot. e o SVG oficial por cima do video, nunca a IA desenhando (regra do Berg)
      const m = this.add.image(320, 140, 'logo-dot').setDisplaySize(360, 150).setAlpha(0).setTint(OBP.PAL.num(OBP.PAL.roxoBrilho)).setDepth(31);
      this.tweens.add({ targets: m, alpha: 0.9, duration: 150, delay: 450, yoyo: true, hold: 500 });
    }
    // os mesmos sons da cena desenhada, no tempo aproximado do gole, da explosao ou da batida do carimbo
    const som = { ctrlz: () => { OBP.Audio.explosao(); OBP.Voice.falar('ctrlz-01'); }, carimbo: () => OBP.Audio.checkpoint() }[this.tipo] || (() => OBP.Audio.item());
    this.time.delayedCall(this.tipo === 'ctrlz' ? 300 : 500, som);
  }
  terminar() {
    if (this.terminado) return;
    this.terminado = true;
    const L = this.L;
    this.scene.resume('Level');
    OBP.Audio.init(L); OBP.Voice.init(L, this.heroiId);
    this.scene.stop();
  }
  flash(ms, alpha) {
    const f = this.add.rectangle(320, 180, 640, 360, OBP.PAL.num(OBP.PAL.branco), alpha).setDepth(20);
    this.time.delayedCall(ms, () => f.destroy());
  }
  texto(x, y, txt, tam, cor) {
    return this.add.text(x, y, txt, OBP.estiloTexto(tam, cor)).setOrigin(0.5).setStroke(OBP.PAL.contorno, 4).setDepth(15);
  }

  // cafe e energetico: mesma coreografia (cara de sono, icone vem de fora ate a boca, flash, punch com tracinhos
  // de energia); so troca o icone, a forca do flash e o raio zigue-zague do energetico. Total 1,4 s nos dois.
  cafeEnergetico(id) {
    const P = OBP.PAL, forte = id === 'energetico', b = this.heroi.getBounds();
    const boca = { x: b.centerX, y: b.y + b.height * 0.3 };
    this.heroi.setTint(P.num(P.azulSombra));   // cara de sono: idle escurecido
    ['Z', 'Z', 'Z'].forEach((zc, i) => {
      const tx = this.texto(b.centerX + 30 + i * 14, b.y - 10 - i * 10, zc, 8 + i * 6, P.branco).setAlpha(0);
      this.tweens.add({
        targets: tx, alpha: 1, y: tx.y - 20, duration: 400, delay: i * 80,
        onComplete: () => this.tweens.add({ targets: tx, alpha: 0, duration: 150, onComplete: () => tx.destroy() }),
      });
    });
    const icone = this.add.image(-40, boca.y, 'item-' + id).setOrigin(0.5).setScale(2).setDepth(11);
    this.tweens.add({
      targets: icone, x: boca.x, duration: 200, delay: 400,
      onComplete: () => {
        this.flash(forte ? 120 : 70, forte ? 1 : 0.85);
        icone.destroy();
        this.heroi.clearTint().setFrame(OBP.FRAMES.punch);
        OBP.Audio.item();
        for (let i = 0; i < 3; i++) this.add.rectangle(b.right + 6 + i * 10, b.centerY - i * 12, 14, 4, P.num(P.moeda)).setDepth(11);
        if (forte) {   // raio pequeno em zigue-zague acima da cabeca, so no energetico: staircase de retangulos retos
          const zx = b.centerX - 10, zy = b.y - 40;
          [[0, 0, 6, 10], [-8, 8, 6, 10], [4, 16, 6, 10], [-4, 24, 6, 10]].forEach(([dx, dy, w, h]) =>
            this.add.rectangle(zx + dx, zy + dy, w, h, P.num(P.moeda)).setOrigin(0).setDepth(11));
        }
      },
    });
  }

  // Ctrl+Z (decisao 93): monitor explode em pedacos, EITA!, CTRL e Z afundam, o monitor volta e um coracao sobe.
  // O efeito (devolve 1 coracao) ja foi aplicado no registry pelo Level.usarItem antes de abrir esta Cena; aqui e
  // so o flourish. Total 1,8 s.
  ctrlz() {
    const P = OBP.PAL, cx = 420, cy = 250;
    this.heroi.x = 220;
    const corpo = this.add.rectangle(cx, cy, 100, 76, P.num(P.rim)).setDepth(9);
    const tela = this.add.rectangle(cx, cy - 6, 84, 54, P.num(P.turquesa)).setDepth(10);
    const teclado = this.add.rectangle(cx, cy + 50, 110, 18, P.num(P.rim)).setDepth(9);
    const eita = this.texto(320, 100, 'EITA!', 16, P.coracao).setVisible(false);
    let n = 0;
    const pisca = this.time.addEvent({ delay: 50, repeat: 5, callback: () => { n++; tela.setFillStyle(P.num(n % 2 ? P.coracao : P.turquesa)); } });
    this.time.delayedCall(300, () => {   // 300 ms de pisca ate explodir
      pisca.remove();
      tela.setVisible(false); corpo.setVisible(false); teclado.setVisible(false);
      OBP.Pedacos.spawn(this, cx, cy, 'estrela32');
      OBP.Audio.explosao();
      this.cameras.main.shake(150, new Phaser.Math.Vector2(3 / 640, 3 / 360));
      this.heroi.setFrame(OBP.FRAMES.hurt);
      eita.setVisible(true);
      OBP.Voice.falar('ctrlz-01');
    });
    this.time.delayedCall(700, () => {
      eita.setVisible(false);
      const ctrl = this.texto(cx - 30, cy + 30, 'CTRL', 8, P.branco), z = this.texto(cx + 26, cy + 30, 'Z', 8, P.branco);
      this.tweens.add({ targets: [ctrl, z], y: '+=4', duration: 200 });
      this.ctrlZ = { ctrl, z };
    });
    this.time.delayedCall(1000, () => {
      if (this.ctrlZ) { this.ctrlZ.ctrl.destroy(); this.ctrlZ.z.destroy(); }
      corpo.setVisible(true); teclado.setVisible(true); tela.setVisible(true).setFillStyle(P.num(P.turquesa));
      this.heroi.setFrame(OBP.FRAMES.idle);
      const coracao = this.add.image(cx, cy, 'item-coracao').setOrigin(0.5).setScale(2).setDepth(11);
      this.tweens.add({ targets: coracao, y: coracao.y - 40, alpha: 0, duration: 400, onComplete: () => coracao.destroy() });
    });
  }

  // Armadura (decisao 93): 4 placas roxas cobrem o heroi de baixo pra cima (120 ms cada), flash, troca pro sprite
  // da armadura, a marca dot. grande atras (alpha 0,25, tint roxo) e fogo tremulando no cabelo por 600 ms. O
  // efeito (coracoesExtra e vestirArmadura) ja foi aplicado pelo Level.usarItem; aqui e so o flourish. Total 1,6 s.
  armadura() {
    const P = OBP.PAL, b = this.heroi.getBounds();
    this.add.image(320, 190, 'logo-dot').setDisplaySize(360, 150).setOrigin(0.5).setAlpha(0.25).setTint(P.num(P.roxo)).setDepth(1);
    const bandas = [
      { y: b.y + b.height * 0.72, h: b.height * 0.28, w: b.width * 0.9 },   // pernas
      { y: b.y + b.height * 0.42, h: b.height * 0.32, w: b.width },         // tronco
      { y: b.y + b.height * 0.22, h: b.height * 0.22, w: b.width * 1.3 },   // bracos
      { y: b.y,                    h: b.height * 0.24, w: b.width * 0.85 }, // cabeca
    ];
    const placas = [];
    bandas.forEach((banda, i) => this.time.delayedCall(i * 120, () =>
      placas.push(this.add.rectangle(b.centerX, banda.y + banda.h / 2, banda.w, banda.h, P.num(P.roxoBrilho), 0.7).setDepth(11))));
    this.time.delayedCall(480, () => {
      this.flash(100, 1);
      placas.forEach(r => r.destroy());   // as placas somem no flash: a armadura completa aparece limpa
      this.heroi.setTexture(OBP.HEROIS[this.heroiId].armaduraId, OBP.FRAMES_ARMADURA.idle);
      OBP.Audio.item();
      // fogo no cabelo: 6 retangulos pequenos tremulando por 600 ms
      const chamas = Array.from({ length: 6 }, (_, i) => this.add.rectangle(290 + i * 12, 90 - (i % 2) * 8, 8, 12, P.num(i % 2 ? P.laranja : P.moeda)).setDepth(12));
      const ev = this.time.addEvent({ delay: 90, repeat: 6, callback: () => chamas.forEach(c => c.setVisible(!c.visible)) });
      this.time.delayedCall(600, () => { ev.remove(); chamas.forEach(c => c.destroy()); });
    });
  }

  // Carimbo (decisao 93): papel com tres linhas, o carimbo desce e bate (150 ms), "APROVADO" verde, estrelinhas
  // saltam e o heroi pisca roxo. Total 1,3 s.
  carimbo() {
    const P = OBP.PAL, px = 300, py = 260;
    this.heroi.x = 200;
    this.add.rectangle(px, py, 70, 90, P.num(P.branco)).setDepth(9);
    for (let i = 0; i < 3; i++) this.add.rectangle(px, py - 24 + i * 18, 50, 6, P.num(P.rim)).setDepth(10);
    const icone = this.add.image(px, py - 160, 'item-carimbo').setOrigin(0.5).setScale(2).setDepth(11);
    this.tweens.add({
      targets: icone, y: py - 10, duration: 150,
      onComplete: () => {
        this.cameras.main.shake(60, new Phaser.Math.Vector2(2 / 640, 2 / 360));
        OBP.Audio.checkpoint();
        this.texto(px, py - 30, 'APROVADO', 8, P.verdeClaro).setAngle(0);
        for (let i = 0; i < 5; i++) {
          const star = this.add.rectangle(px - 40 + i * 20, py + 10, 6, 6, P.num(P.moeda)).setDepth(11);
          this.tweens.add({ targets: star, y: star.y - 20, alpha: 0, duration: 400, delay: i * 30, onComplete: () => star.destroy() });
        }
        let n = 0;
        const ev = this.time.addEvent({ delay: 100, repeat: 3, callback: () => { n++; if (n % 2) this.heroi.setTint(P.num(P.roxoBrilho)); else this.heroi.clearTint(); } });
        this.time.delayedCall(500, () => { ev.remove(); this.heroi.clearTint(); });
      },
    });
  }
};
// duracao total por item (o Berg pediu ritmo proprio por item, nao um teto unico: ctrlz e armadura pedem mais
// tempo pela quantidade de passos). Puro fora da classe, no padrao de OBP.CHEFE e OBP.JOKENPO em config.js.
OBP.Cena.DURACAO = { cafe: 1400, energetico: 1400, ctrlz: 1800, armadura: 1600, carimbo: 1300 };
