// Jokenpô do Sobrinho (decisões 65 e 85). Abre por cima da arena da fase 'chefe' com o Level PAUSADO embaixo:
// pausado, e não parado, para o herói e o Sobrinho continuarem em cena e esta cena poder trocar o quadro deles
// (o braço esticado da revelação) sem o update do Level desfazer. Estrutura estudada nos dois Alex Kidd (1986 e
// DX): balão de pensamento AO VIVO sobre o herói com a mão escolhida, bolinhas de ponto embaixo do nome, JO KEN
// PÔ em corte de tela no tempo da música (120 BPM, 500 ms a batida), tell no balão do chefe (a bola de telepatia,
// com um blefe), revelação com os dois esticando o braço, melhor de 3. Perder custa 1 coração e a revanche é na
// hora. As setas SEMPRE trocam a mão, inclusive na espera: foi o "travou" da decisão 84.
OBP.Boss = class extends Phaser.Scene {
  constructor() { super('Boss'); }

  // balão de pensamento 56x44 desenhado por código: nuvem branca com contorno e duas bolinhas de rabo
  static criarBalao(scene) {
    const P = OBP.PAL;
    const l = [
      '..........######################..........',
      '.......###oooooooooooooooooooooo###.......',
      '....###ooooooooooooooooooooooooooooo###...',
      '..##ooooooooooooooooooooooooooooooooooo##.',
      '.#ooooooooooooooooooooooooooooooooooooooo#',
      '#ooooooooooooooooooooooooooooooooooooooooo#',
      '#ooooooooooooooooooooooooooooooooooooooooo#',
      '#ooooooooooooooooooooooooooooooooooooooooo#',
      '#ooooooooooooooooooooooooooooooooooooooooo#',
      '#ooooooooooooooooooooooooooooooooooooooooo#',
      '#ooooooooooooooooooooooooooooooooooooooooo#',
      '#ooooooooooooooooooooooooooooooooooooooooo#',
      '#ooooooooooooooooooooooooooooooooooooooooo#',
      '#ooooooooooooooooooooooooooooooooooooooooo#',
      '#ooooooooooooooooooooooooooooooooooooooooo#',
      '#ooooooooooooooooooooooooooooooooooooooooo#',
      '#ooooooooooooooooooooooooooooooooooooooooo#',
      '#ooooooooooooooooooooooooooooooooooooooooo#',
      '#ooooooooooooooooooooooooooooooooooooooooo#',
      '#ooooooooooooooooooooooooooooooooooooooooo#',
      '#ooooooooooooooooooooooooooooooooooooooooo#',
      '#ooooooooooooooooooooooooooooooooooooooooo#',
      '#ooooooooooooooooooooooooooooooooooooooooo#',
      '#ooooooooooooooooooooooooooooooooooooooooo#',
      '#ooooooooooooooooooooooooooooooooooooooooo#',
      '#ooooooooooooooooooooooooooooooooooooooooo#',
      '.#ooooooooooooooooooooooooooooooooooooooo#',
      '..##ooooooooooooooooooooooooooooooooooo##.',
      '....###ooooooooooooooooooooooooooooo###...',
      '.......###oooooooooooooooooooooo###.......',
      '..........######################..........',
      '..............####........................',
      '.............#oooo#.......................',
      '..............####........................',
      '...........###............................',
      '..........#ooo#...........................',
      '...........###............................',
    ];
    const larg = l[0].length;
    OBP.pixels(scene, 'ui-balao', l.map(s => s.padEnd(larg, '.')), { '#': P.contorno, 'o': P.branco });
  }

  create() {
    const P = OBP.PAL, B = OBP.CHEFE.BATIDA_MS, J = OBP.JOKENPO;
    this.L = this.scene.get('Level'); this.heroi = this.L.player; this.chefe = this.L.chefe;
    this.heroiId = this.L.heroiId;
    this.scene.pause('Level');
    if (this.L.nomeFase && this.L.nomeFase.active) this.time.delayedCall(1200, () => { if (this.L.nomeFase.active) this.L.nomeFase.destroy(); });
    OBP.Boss.criarBalao(this);
    OBP.Audio.init(this); OBP.Voice.init(this, this.heroiId);
    OBP.Musica.tocar(this, 'mus-jokenpo', OBP.MIX.musicaFase);

    const cam = this.L.cameras.main;
    this.hx = Math.round(this.heroi.x - cam.scrollX); this.hy = Math.round(this.heroi.y - cam.scrollY);
    this.cx = Math.round(this.chefe.x - cam.scrollX); this.cy = Math.round(this.chefe.y - cam.scrollY);
    const topoH = this.hy - this.heroi.height + (this.heroi.height === 96 ? 14 : 2), topoC = this.cy - 96 + 14;

    // nomes e bolinhas de ponto embaixo, como o "ALEX" com as bolinhas do original
    const nome = (x, txt) => this.add.text(x, 64, txt, OBP.estiloTexto(8, P.branco)).setOrigin(0.5).setStroke(P.contorno, 4);
    nome(this.hx, OBP.HEROIS[this.heroiId].nome); nome(this.cx, 'SOBRINHO');
    const bolinha = (x) => this.add.rectangle(x, 80, 10, 10, P.num(P.contorno), 0.6).setStrokeStyle(2, P.num(P.cinzaClaro));
    this.pontosH = [bolinha(this.hx - 9), bolinha(this.hx + 9)];
    this.pontosC = [bolinha(this.cx - 9), bolinha(this.cx + 9)];

    // balões: o do herói mostra a mão escolhida a cada instante; o do chefe só aparece no tell e na revelação
    this.balaoH = this.add.image(this.hx + 8, topoH - 6, 'ui-balao').setOrigin(0.5, 1);
    this.maoH = this.add.image(this.hx + 8, topoH - 6 - 22, 'jkp-papel').setOrigin(0.5);
    this.balaoC = this.add.image(this.cx - 8, topoC - 6, 'ui-balao').setOrigin(0.5, 1).setFlipX(true).setVisible(false);
    this.maoC = this.add.image(this.cx - 8, topoC - 6 - 22, 'jkp-papel').setOrigin(0.5).setVisible(false);
    this.rotuloH = this.add.text(this.hx + 8, topoH - 6 - 50, '', OBP.estiloTexto(8, P.moeda)).setOrigin(0.5).setStroke(P.contorno, 4);

    // corte de tela: faixa colorida com a batida em 48 px, e o resultado da rodada em 16 px
    this.faixa = this.add.rectangle(320, 180, 640, 100, P.num(P.moeda), 0.92).setVisible(false);
    this.grande = this.add.text(320, 180, '', OBP.estiloTexto(48, P.branco)).setOrigin(0.5).setStroke(P.contorno, 8).setVisible(false);
    this.resultado = this.add.text(320, 168, '', OBP.estiloTexto(16, P.moeda)).setOrigin(0.5).setStroke(P.contorno, 4).setVisible(false);
    this.aviso = this.add.text(320, 340, '', OBP.estiloTexto(8, P.branco)).setOrigin(0.5).setStroke(P.contorno, 4);
    this.aperte = this.add.text(320, 168, OBP.Toque.ativo ? 'APERTE PULO' : 'APERTE ESPAÇO', OBP.estiloTexto(16, P.moeda)).setOrigin(0.5).setStroke(P.contorno, 4);
    this.aviso.setText(OBP.Toque.ativo ? 'TOQUE < > PARA TROCAR A MÃO   MELHOR DE 3' : 'SETAS TROCAM A MÃO   MELHOR DE 3');

    this.inp = new OBP.Input(this, ['esq', 'dir', 'pulo']);
    this.B = B; this.sel = 1; this.rodada = 0; this.pontos = { jogador: 0, chefe: 0 };
    this.fase = 'espera'; this.proximo = 0; this.travada = null; this.piscar = 0;
    this.chefe.setFrame(0); this.heroi.setFrame(this.heroi.frames().idle);
    this.mostrarMao();
  }

  mao(i) { return OBP.JOKENPO.MAOS[(i + 3) % 3]; }
  mostrarMao() {
    const m = this.mao(this.sel);
    this.maoH.setTexture('jkp-' + OBP.JOKENPO.MAO[m]);
    this.rotuloH.setText(OBP.JOKENPO.MAO[m].toUpperCase() + ' = ' + m.toUpperCase());
  }
  mover(d) { this.sel = (this.sel + d + 3) % 3; OBP.Audio.menuMover(); this.mostrarMao(); }
  corte(txt, cor, ms) {
    this.faixa.setFillStyle(OBP.PAL.num(cor), 0.92).setVisible(true); this.grande.setText(txt).setVisible(true);
    this.time.delayedCall(ms, () => { this.faixa.setVisible(false); this.grande.setVisible(false); });
  }
  balaoChefe(m) {
    this.balaoC.setVisible(!!m); this.maoC.setVisible(!!m);
    if (m) this.maoC.setTexture('jkp-' + OBP.JOKENPO.MAO[m]);
  }

  update(t) {
    const e = this.inp.ler(), B = this.B, P = OBP.PAL, J = OBP.JOKENPO;
    if (this.fase === 'fim') return;
    const podeTrocar = this.fase === 'espera' || this.fase === 'escolha' || this.fase === 'jo' || this.fase === 'ken';
    if (podeTrocar) { if (e.esqAgora) this.mover(-1); if (e.dirAgora) this.mover(1); }

    if (this.fase === 'espera') {
      if (t >= this.piscar) { this.aperte.setVisible(!this.aperte.visible); this.piscar = t + 400; }
      if (e.startAgora || e.puloAgora || e.socoAgora) { this.aperte.setVisible(false); this.iniciar(t); }
      return;
    }
    if (this.fase === 'escolha') { if (t >= this.proximo) this.iniciar(t); return; }
    if (t < this.proximo) return;

    if (this.fase === 'jo') {
      this.fase = 'ken'; this.proximo = t + B;
      this.corte('KEN', P.laranja, 350); OBP.Audio.menuMover();
      // tell com blefe: mostra uma mão errada por 200 ms e depois a verdadeira, como a bola de telepatia
      const real = J.maoDoChefe('sobrinho', this.rodada), blefe = J.MAOS.find(m => m !== real);
      this.balaoChefe(blefe); this.chefe.setFrame(1);
      this.time.delayedCall(200, () => { if (this.fase === 'ken') this.balaoChefe(real); });
    } else if (this.fase === 'ken') {
      this.fase = 'po'; this.proximo = t + B;
      this.corte('PÔ!', P.coracao, 350); OBP.Audio.menuConfirmar();
      // a escolha trava 100 ms DEPOIS da batida: quem aperta junto com o PÔ não perde por isso
      this.time.delayedCall(100, () => this.revelar());
    } else if (this.fase === 'po') {
      this.resolver(t);
    } else if (this.fase === 'resultado') {
      this.resultado.setVisible(false); this.balaoChefe(null);
      this.heroi.setFrame(this.heroi.frames().idle); this.chefe.setFrame(0);
      const v = J.vencedor(this.pontos);
      if (v) return this.terminar(v);
      this.rodada++; this.fase = 'escolha'; this.proximo = t + 3 * B;
      this.aviso.setText('ESCOLHA A MÃO');
    }
  }

  iniciar(t) {
    this.fase = 'jo'; this.proximo = t + this.B;
    this.corte('JO', OBP.PAL.moeda, 350); OBP.Audio.menuMover();
    this.aviso.setText('');
    if (this.rodada === 0) OBP.VozInimigo.falar(this, 'chefe', { variantes: 2 });
  }
  // os dois esticam o braço: o herói no quadro de soco, o chefe no quadro da mão dele
  revelar() {
    if (this.fase !== 'po') return;
    const m = OBP.JOKENPO.maoDoChefe('sobrinho', this.rodada);
    this.travada = this.mao(this.sel);
    this.heroi.setFrame(this.heroi.frames().punch);
    this.chefe.setFrame(OBP.JOKENPO.QUADRO[m]); this.balaoChefe(m);
    OBP.Audio.soco();
  }
  resolver(t) {
    const P = OBP.PAL, J = OBP.JOKENPO, m = J.maoDoChefe('sobrinho', this.rodada);
    const r = J.duelo(this.travada, m);
    this.fase = 'resultado'; this.proximo = t + 2 * this.B;
    if (r > 0) {
      this.pontos.jogador++; this.resultado.setText('BOA!').setColor(P.moeda);
      this.chefe.setFrame(5); OBP.Audio.dano(); OBP.Voice.falar('jkp-01');
      this.cameras.main.shake(83, new Phaser.Math.Vector2(2 / 640, 2 / 360));
    } else if (r < 0) {
      this.pontos.chefe++; this.resultado.setText('PERDEU').setColor(P.coracao);
      this.chefe.setFrame(7); this.heroi.setFrame(this.heroi.frames().hurt); OBP.Audio.bloco();
      OBP.VozInimigo.falar(this, 'chefe', { variantes: 2, prioritaria: true });
    } else { this.resultado.setText('EMPATE').setColor(P.cinzaClaro); OBP.Audio.menuMover(); }
    this.resultado.setVisible(true);
    this.pontosH.forEach((b, i) => b.setFillStyle(P.num(i < this.pontos.jogador ? P.moeda : P.contorno), i < this.pontos.jogador ? 1 : 0.6));
    this.pontosC.forEach((b, i) => b.setFillStyle(P.num(i < this.pontos.chefe ? P.laranja : P.contorno), i < this.pontos.chefe ? 1 : 0.6));
  }
  terminar(v) {
    const P = OBP.PAL, ganhou = v === 'jogador';
    this.fase = 'fim';
    this.resultado.setText(ganhou ? 'VENCEU O JOKENPÔ!' : 'REPROVADO').setColor(ganhou ? P.moeda : P.coracao).setVisible(true);
    this.aviso.setText(ganhou ? 'AGORA ELE VAI ATACAR' : 'ISSO CUSTA UM CORAÇÃO');
    this.chefe.setFrame(ganhou ? 5 : 7); this.heroi.setFrame(ganhou ? this.heroi.frames().idle : this.heroi.frames().hurt);
    this.balaoH.setVisible(false); this.maoH.setVisible(false); this.rotuloH.setVisible(false);
    this.time.delayedCall(1500, () => {
      const L = this.L;
      this.scene.resume('Level');
      OBP.Voice.init(L, this.heroiId);
      if (ganhou) {
        OBP.Musica.tocar(L, 'mus-chefe', OBP.MIX.musicaFase);
        L.controle = true; L.chefe.iniciarLuta();
        this.scene.stop();
        return;
      }
      L.ferirJogador(-1);
      OBP.Musica.parar();
      // revanche na hora, se o coração não era o último; senão o Level cuida da morte e reabre o jokenpô sozinho
      this.time.delayedCall(1200, () => { if (L.morrendo || !L.scene.isActive()) this.scene.stop(); else this.scene.restart(); });
    });
  }
};
