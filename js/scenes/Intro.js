// Introducao (decisao 93, Berg): antes da fase 1, o heroi escolhido conta em quatro quadros rapidos por que a
// agencia esta em risco (o Mama Canva, sobrinho do cliente), o que vai fazer (resgatar o briefing perdido) e o
// que acontece se falhar (madrugadas consertando lambanca). Cada quadro tem a fala gravada do heroi, o texto
// escrito letra a letra e uma cena montada com os sprites e as cores do jogo. Qualquer tecla ou toque pula o
// quadro; no fim, a fase 1 abre direto, sem copa (a loja so existe a partir da fase 2).
OBP.Intro = class extends Phaser.Scene {
  constructor() { super('Intro'); }
  init(d) {
    this.faseId = (d && d.fase) || OBP.ORDEM[0];
    this.heroiId = this.registry.get('heroi') || 'tikinho';
    this.saindo = false; this.i = -1;
  }
  create() {
    const P = OBP.PAL, tk = this.heroiId === 'tikinho';
    OBP.Audio.init(this); OBP.Voice.init(this, this.heroiId);
    this.cameras.main.setBackgroundColor(P.contorno);
    // o texto escrito e o mesmo da fala gravada (falas-para-aprovar.md, intro-01 a 04)
    this.textos = tk ? [
      'A dot. tá correndo um risco grande: deixar o job na mão de um MAMA CANVA.',
      'Mama Canva é o sobrinho do cliente. Resolve tudo no programa errado, visse?',
      'Bora resgatar o briefing perdido e entregar coisa decente, melhor que a dele.',
      'Se não der, é madrugada atrás de madrugada consertando a lambança do Mama Canva.',
    ] : [
      'A dot. tá correndo um risco sério, cara: deixar o job com um MAMA CANVA.',
      'Mama Canva é o sobrinho do cliente, meu irmão. Faz tudo no programa errado.',
      'Vamos resgatar o briefing perdido e entregar coisa decente, cara. Melhor que a dele.',
      'Senão é madrugada atrás de madrugada consertando o que o Mama Canva deixou, cara.',
    ];
    this.camada = this.add.container(0, 0);
    this.add.rectangle(320, 316, 608, 72, P.num(P.contorno), 0.92).setStrokeStyle(2, P.num(P.roxoBrilho));
    this.txt = this.add.text(32, 292, '', OBP.estiloTexto(8, P.branco)).setWordWrapWidth(576).setLineSpacing(4);
    this.add.text(624, 350, OBP.Toque.ativo ? 'TOQUE PULA' : 'ESPAÇO PULA', OBP.estiloTexto(8, P.cinzaClaro)).setOrigin(1, 1);
    this.inp = new OBP.Input(this, ['pulo']);
    this.proximo();
    this.cameras.main.fadeIn(200, 0, 0, 0);
  }
  limpar() { this.camada.removeAll(true); this.tweens.killAll(); this.time.removeAllEvents(); }
  proximo() {
    if (this.saindo) return;
    this.i++;
    if (this.i >= 4) return this.fim();
    this.limpar();
    this['quadro' + this.i]();
    this.escrever(this.textos[this.i]);
    OBP.Voice.falarUma(['intro-0' + (this.i + 1)]);
    this.time.delayedCall(4600, () => this.proximo());   // troca sozinho; a tecla adianta
  }
  escrever(s) {
    this.txt.setText(''); let n = 0;
    this.time.addEvent({ delay: 22, repeat: s.length - 1, callback: () => this.txt.setText(s.slice(0, ++n)) });
  }
  // cenario: o fundo da fase repetido, uma faixa escura por cima e o chao
  fundo(chave, escuro) {
    const P = OBP.PAL;
    if (this.textures.exists(chave)) {
      const alt = this.textures.get(chave).getSourceImage().height;
      const f = this.add.tileSprite(0, 0, 640, 280, chave).setOrigin(0); f.tilePositionY = Math.max(0, alt - 280); this.camada.add(f);
    }
    if (escuro) this.camada.add(this.add.rectangle(320, 140, 640, 280, P.num(P.contorno), escuro));
    this.camada.add(this.add.rectangle(320, 270, 640, 20, P.num(P.terra)));
  }
  heroi(x, quadro) { const s = this.add.sprite(x, 260, this.heroiId, quadro).setOrigin(0.5, 1).setScale(2); this.camada.add(s); return s; }
  // 0: a agencia com o alarme de risco piscando
  quadro0() {
    const P = OBP.PAL, F = OBP.FRAMES; this.fundo('fundo-fase-01', 0.35);
    const h = this.heroi(200, F.idle);
    const mon = this.add.rectangle(440, 200, 120, 80, P.num(P.rim)).setStrokeStyle(4, P.num(P.contorno));
    const tela = this.add.rectangle(440, 196, 104, 60, P.num(P.coracao));
    const rot = this.add.text(440, 196, 'RISCO', OBP.estiloTexto(16, P.branco)).setOrigin(0.5);
    this.camada.add([mon, tela, rot, this.add.rectangle(440, 252, 24, 16, P.num(P.contorno))]);
    this.tweens.add({ targets: [tela, rot], alpha: 0.2, duration: 220, yoyo: true, repeat: -1 });
    this.tweens.add({ targets: h, y: 256, duration: 300, yoyo: true, repeat: -1 });
  }
  // 1: o Mama Canva, o Sobrinho, arrastando bloco no programa errado
  quadro1() {
    const P = OBP.PAL; this.fundo('fundo-chefe', 0.2);
    if (this.textures.exists('sobrinho')) {
      const s = this.add.sprite(210, 260, 'sobrinho', 1).setOrigin(0.5, 1).setScale(2); this.camada.add(s);
      this.tweens.add({ targets: s, angle: 3, duration: 260, yoyo: true, repeat: -1 });
    }
    const jan = this.add.rectangle(450, 170, 260, 170, P.num(P.branco)).setStrokeStyle(4, P.num(P.contorno));
    const barra = this.add.rectangle(450, 95, 260, 20, P.num(P.turquesa));
    const blocos = [[380, 150, P.moeda], [450, 150, P.laranja], [520, 150, P.verdeClaro], [380, 210, P.roxoBrilho], [450, 210, P.coracao], [520, 210, P.turquesa]]
      .map(([x, y, c]) => this.add.rectangle(x, y, 48, 40, P.num(c)));
    const cursor = this.add.rectangle(400, 230, 8, 12, P.num(P.contorno));
    this.camada.add([jan, barra, ...blocos, cursor, this.add.text(450, 95, 'MAMA CANVA', OBP.estiloTexto(8, P.branco)).setOrigin(0.5)]);
    this.tweens.add({ targets: cursor, x: 520, y: 150, duration: 500, yoyo: true, repeat: -1 });
    this.tweens.add({ targets: blocos, angle: 8, duration: 400, yoyo: true, repeat: -1 });
  }
  // 2: correndo atras do briefing, rumo a torre
  quadro2() {
    const P = OBP.PAL, F = OBP.FRAMES; this.fundo('fundo-fase-08', 0.25);
    const h = this.heroi(120, F.walk1);
    const ciclo = [F.walk1, F.walk2, F.walk3, F.walk2]; let k = 0;
    this.time.addEvent({ delay: 90, loop: true, callback: () => h.setFrame(ciclo[++k % 4]) });
    this.tweens.add({ targets: h, x: 300, duration: 2600 });
    const folha = this.add.rectangle(520, 150, 56, 72, P.num(P.branco)).setStrokeStyle(3, P.num(P.contorno));
    const linhas = [0, 1, 2, 3].map(i => this.add.rectangle(520, 132 + i * 12, 36, 4, P.num(P.cinzaClaro)));
    const rot = this.add.text(520, 200, 'BRIEFING', OBP.estiloTexto(8, P.moeda)).setOrigin(0.5);
    this.camada.add([folha, ...linhas, rot]);
    this.tweens.add({ targets: [folha, ...linhas, rot], y: '-=8', duration: 500, yoyo: true, repeat: -1 });
  }
  // 3: a madrugada consertando a lambanca
  quadro3() {
    const P = OBP.PAL, F = OBP.FRAMES; this.fundo('fundo-fase-01', 0.8);
    const h = this.heroi(240, F.hurt);
    const mesa = this.add.rectangle(400, 262, 220, 16, P.num(P.terraEscura));
    const mon = this.add.rectangle(420, 210, 110, 76, P.num(P.rim)).setStrokeStyle(4, P.num(P.contorno));
    const tela = this.add.rectangle(420, 206, 94, 56, P.num(P.petroleo));
    const err = this.add.text(420, 206, 'ERRO\nERRO\nERRO', OBP.estiloTexto(8, P.coracao)).setOrigin(0.5).setAlign('center');
    const relogio = this.add.text(90, 60, '03:47', OBP.estiloTexto(32, P.moeda)).setOrigin(0.5);
    const zz = this.add.text(200, 120, 'z z z', OBP.estiloTexto(16, P.cinzaClaro)).setOrigin(0.5);
    this.camada.add([mesa, mon, tela, err, relogio, zz]);
    this.tweens.add({ targets: err, alpha: 0.3, duration: 180, yoyo: true, repeat: -1 });
    this.tweens.add({ targets: zz, y: 100, alpha: 0.2, duration: 900, repeat: -1 });
    this.tweens.add({ targets: h, angle: -4, duration: 700, yoyo: true, repeat: -1 });
  }
  update() {
    const e = this.inp.ler();
    if (e.puloAgora || e.startAgora) this.proximo();
  }
  fim() {
    if (this.saindo) return;
    this.saindo = true; this.limpar();
    this.cameras.main.fadeOut(220, 0, 0, 0);
    this.time.delayedCall(240, () => this.scene.start('Level', { fase: this.faseId }));
  }
};
