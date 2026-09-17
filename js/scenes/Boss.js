// Chefe final: o jokenpô do Sobrinho que Desenha (spec 6). Cena sobreposta ao Level, que fica pausado.
// Cerimônia a 120 BPM, três batidas de 500 ms: "jo" (chefe pronto), "ken" (tell de 500 ms nos ombros dele),
// "pô" (a escolha trava no início da batida). O cursor anda com esquerda e direita durante jo e ken.
// Melhor de 3. A sequência do chefe é FIXA, para o jogador perder uma vez, aprender e ganhar na revanche.
OBP.Boss = class extends Phaser.Scene {
  constructor() { super('Boss'); }

  // ícones do jokenpô desenhados por código, 32x32, para não depender de arte que ainda não existe
  static criarIcones(scene) {
    const P = OBP.PAL;
    OBP.pixels(scene, 'jkp-briefing', [
      '................................', '......####################......',
      '......#..................#......', '......#..oooooooooooooo..#......',
      '......#..................#......', '......#..oooooooooo......#......',
      '......#..................#......', '......#..oooooooooooooo..#......',
      '......#..................#......', '......#..oooooooo........#......',
      '......#..................#......', '......#..oooooooooooooo..#......',
      '......#..................#......', '......#..oooooooooo......#......',
      '......#..................#......', '......#..oooooooooooooo..#......',
      '......#..................#......', '......#..oooooooo........#......',
      '......#..................#......', '......#..oooooooooooooo..#......',
      '......#..................#......', '......#..................#......',
      '......#..................#......', '......#..................#......',
      '......#..................#......', '......#..................#......',
      '......####################......', '................................',
      '................................', '................................',
      '................................', '................................',
    ], { '#': P.cinzaClaro, 'o': P.rim });
    OBP.pixels(scene, 'jkp-prazo', [
      '............########............', '.........###........###.........',
      '.......##..............##.......', '......#..................#......',
      '.....#....................#.....', '....#......................#....',
      '...#........................#...', '..#..........................#..',
      '..#..........................#..', '.#............................#.',
      '.#............ooo.............#.', '#..............o...............#',
      '#..............o...............#', '#..............o...............#',
      '#..............oooooo..........#', '#..............................#',
      '#..............................#', '#..............................#',
      '.#............................#.', '.#............................#.',
      '..#..........................#..', '..#..........................#..',
      '...#........................#...', '....#......................#....',
      '.....#....................#.....', '......#..................#......',
      '.......##..............##.......', '.........###........###.........',
      '............########............', '................................',
      '................................', '................................',
    ], { '#': P.cinzaClaro, 'o': P.coracao });
    OBP.pixels(scene, 'jkp-verba', [
      '..............####..............', '..............#..#..............',
      '.............#....#.............', '............#......#............',
      '...........##########...........', '..........#..........#..........',
      '.........#............#.........', '........#..............#........',
      '.......#................#.......', '......#..................#......',
      '.....#....................#.....', '.....#......oooooo........#.....',
      '....#......o......o........#....', '....#......o...............#....',
      '....#.......oooo...........#....', '....#...........o..........#....',
      '....#......o....o..........#....', '....#.......oooo...........#....',
      '....#......................#....', '.....#....................#.....',
      '.....#....................#.....', '......#..................#......',
      '......#..................#......', '.......#................#.......',
      '........################........', '................................',
      '................................', '................................',
      '................................', '................................',
      '................................', '................................',
    ], { '#': P.cinzaClaro, 'o': P.moeda });
  }

  init(data) {
    this.chefe = (data && data.chefe) || 'sobrinho';
    this.heroiId = (data && data.heroi) || this.registry.get('heroi') || 'tikinho';
    this.aoFim = (data && data.aoFim) || null;
  }

  create() {
    const P = OBP.PAL;
    OBP.Boss.criarIcones(this);
    this.add.rectangle(320, 180, 640, 360, P.num(P.contorno), 0.92).setScrollFactor(0);
    this.add.text(320, 28, 'REUNIÃO DE APROVAÇÃO', OBP.estiloTexto(16, P.branco)).setOrigin(0.5);

    // herói à esquerda, chefe à direita virado para ele
    this.heroi = this.add.sprite(170, 250, this.heroiId, OBP.FRAMES.idle).setOrigin(0.5, 1);
    this.chefeSpr = this.add.sprite(470, 250, 'sobrinho', 0).setOrigin(0.5, 1).setFlipX(true);
    this.tell = this.add.rectangle(470, 170, 24, 24, P.num(P.branco)).setVisible(false);

    // três ícones e o cursor
    this.icones = OBP.JOKENPO.MAOS.map((m, i) => this.add.image(224 + i * 96, 316, 'jkp-' + m).setOrigin(0.5));
    this.cursor = this.add.rectangle(224, 316, 40, 40).setStrokeStyle(2, P.num(P.moeda));
    this.sel = 0;

    this.placar = this.add.text(320, 60, '0 x 0', OBP.estiloTexto(16, P.moeda)).setOrigin(0.5);
    this.aviso = this.add.text(320, 108, 'SETAS ESCOLHEM', OBP.estiloTexto(8, P.cinzaClaro)).setOrigin(0.5);
    this.batidaTxt = this.add.text(320, 150, '', OBP.estiloTexto(32, P.branco)).setOrigin(0.5);

    OBP.Musica.tocar(this, 'mus-chefe', OBP.MIX.musicaFase);
    this.pontos = { jogador: 0, chefe: 0 };
    this.rodada = 0;
    this.inp = new OBP.Input(this, ['esq', 'dir', 'pulo']);
    this.fase = 'espera';     // espera, jo, ken, po, resolve, fim
    this.proximo = 0;
    this.travada = null;      // mão travada no início do "pô"
  }

  moverCursor(d) {
    this.sel = Phaser.Math.Clamp(this.sel + d, 0, 2);
    this.cursor.x = 224 + this.sel * 96;
    OBP.Audio.menuMover();
  }

  update(t) {
    if (this.fase === 'fim') return;
    const e = this.inp.ler();
    if (this.fase === 'espera') {                       // um toque começa a rodada
      this.batidaTxt.setText('APERTE');
      if (e.startAgora || e.puloAgora || e.socoAgora) { this.iniciarRodada(t); }
      return;
    }
    if ((this.fase === 'jo' || this.fase === 'ken')) {
      if (e.esqAgora) this.moverCursor(-1);
      if (e.dirAgora) this.moverCursor(1);
    }
    if (t < this.proximo) return;

    if (this.fase === 'jo') {                            // "ken": o tell aparece por 500 ms
      this.fase = 'ken'; this.proximo = t + 500;
      this.batidaTxt.setText('KEN');
      const mao = OBP.JOKENPO.maoDoChefe(this.chefe, this.rodada);
      this.tell.setFillStyle(OBP.PAL.num(this.corDaMao(mao))).setVisible(true);
      this.chefeSpr.setFrame(1);                         // provoca: ombros e cabeça, não a mão
      OBP.Audio.menuMover();
    } else if (this.fase === 'ken') {                    // "pô": trava a escolha e revela
      this.fase = 'po'; this.proximo = t + 400;
      this.travada = OBP.JOKENPO.MAOS[this.sel];
      this.batidaTxt.setText('PÔ');
      this.tell.setVisible(false);
      this.revelar();
    } else if (this.fase === 'po') {
      this.resolver(t);
    } else if (this.fase === 'resolve') {
      const v = OBP.JOKENPO.vencedor(this.pontos);
      if (v) return this.terminar(v);
      this.rodada++; this.fase = 'espera'; this.chefeSpr.setFrame(0); this.heroi.setFrame(OBP.FRAMES.idle);
    }
  }

  corDaMao(mao) {
    return mao === 'briefing' ? OBP.PAL.branco : mao === 'prazo' ? OBP.PAL.coracao : OBP.PAL.moeda;
  }

  iniciarRodada(t) {
    if (this.rodada === 0) OBP.VozInimigo.falar(this, 'chefe', { variantes: 2 });   // abre a luta provocando
    this.fase = 'jo'; this.proximo = t + 500;
    this.batidaTxt.setText('JO');
    this.chefeSpr.setFrame(0);
    OBP.Audio.menuMover();
  }

  revelar() {
    const mao = OBP.JOKENPO.maoDoChefe(this.chefe, this.rodada);
    this.chefeSpr.setFrame(2 + OBP.JOKENPO.MAOS.indexOf(mao));   // 2 briefing, 3 prazo, 4 verba
    this.heroi.setFrame(OBP.FRAMES.punch);
  }

  resolver(t) {
    const mao = OBP.JOKENPO.maoDoChefe(this.chefe, this.rodada);
    const r = OBP.JOKENPO.duelo(this.travada, mao);
    if (r > 0) { this.pontos.jogador++; this.chefeSpr.setFrame(5); OBP.Audio.menuConfirmar(); }
    else if (r < 0) {
      this.pontos.chefe++; this.chefeSpr.setFrame(7); this.heroi.setFrame(OBP.FRAMES.hurt); OBP.Audio.dano();
      OBP.VozInimigo.falar(this, 'chefe', { variantes: 2, prioritaria: true });   // ele provoca quando ganha
    }
    else { this.batidaTxt.setText('EMPATE'); }
    this.placar.setText(`${this.pontos.jogador} x ${this.pontos.chefe}`);
    this.fase = 'resolve'; this.proximo = t + (r === 0 ? 700 : 900);
  }

  terminar(v) {
    this.fase = 'fim';
    const ganhou = v === 'jogador';
    this.chefeSpr.setFrame(ganhou ? 6 : 7);
    this.batidaTxt.setText(ganhou ? 'APROVADO' : 'SÓ UM AJUSTE');
    OBP.Voice.falar(ganhou ? 'vitchefe-01' : 'jkp-01');
    this.time.delayedCall(1800, () => {
      const cb = this.aoFim;
      OBP.Musica.tocar(this, 'mus-fase-08', OBP.MIX.musicaFase);   // devolve a trilha da torre
      this.scene.stop();
      if (cb) cb(ganhou); else this.scene.resume('Level');
    });
  }
};
