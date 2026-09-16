// Level: monta a fase a partir do ASCII, instancia o herói e roda o loop. Blocos, itens, inimigos, HUD, dano,
// checkpoint e saída entram nas Tasks 5 a 9 modificando esta cena.
OBP.Level = class extends Phaser.Scene {
  constructor() { super('Level'); }
  init(data) {
    this.faseId = (data && data.fase) || 'fase-01';
    this.checkpoint = (data && data.checkpoint) || null;
    this.heroiId = this.registry.get('heroi') || 'tikinho';
  }
  // 7 tiles de 32 em uma textura 224x32, na ordem de OBP.Mapa.LEG mais o usado (6). Só retângulos: sem anti-aliasing.
  static criarTiles(scene) {
    if (scene.textures.exists('tiles')) return;
    const P = OBP.PAL, n = P.num, g = scene.make.graphics({ add: false });
    const r = (x, y, w, h, cor) => { g.fillStyle(n(cor)); g.fillRect(x, y, w, h); };
    const bloco = (i, fundo, borda) => { r(i * 32, 0, 32, 32, borda); r(i * 32 + 2, 2, 28, 28, fundo); };
    // 0 chão e parede
    r(0, 0, 32, 32, P.terra); r(0, 0, 32, 4, P.areia); r(0, 31, 32, 1, P.terraEscura); r(31, 0, 1, 32, P.terraEscura);
    // 1 one-way: tábua de 8 px no topo, resto transparente
    r(32, 0, 32, 7, P.areia); r(32, 7, 32, 1, P.terraEscura);
    // 2 estrela
    bloco(2, P.moeda, P.laranja); r(64 + 14, 8, 4, 16, P.branco); r(64 + 8, 14, 16, 4, P.branco);
    // 3 pergunta
    bloco(3, P.turquesa, P.petroleo); r(96 + 10, 7, 12, 4, P.branco); r(96 + 18, 11, 4, 5, P.branco); r(96 + 14, 15, 8, 4, P.branco); r(96 + 14, 19, 4, 3, P.branco); r(96 + 14, 24, 4, 4, P.branco);
    // 4 reforçado (só o gilpp quebra)
    bloco(4, P.rim, P.pretoCamisa); [[6, 6], [24, 6], [6, 24], [24, 24]].forEach(([x, y]) => r(128 + x, y, 2, 2, P.contorno));
    // 5 espinho: 4 pontas em degraus, sem colisão (fere por sobreposição)
    for (let k = 0; k < 4; k++) { const x = 160 + k * 8; r(x, 28, 8, 4, P.cinzaClaro); r(x + 1, 24, 6, 4, P.cinzaClaro); r(x + 2, 20, 4, 4, P.cinzaClaro); r(x + 3, 16, 2, 4, P.branco); }
    // 6 pergunta usada
    bloco(6, P.cabeloGil, P.rim);
    g.generateTexture('tiles', 224, 32); g.destroy();
  }
  create() {
    const fase = OBP.FASES[this.faseId];
    this.m = OBP.Mapa.parse(fase.mapa);
    OBP.Level.criarTiles(this);
    this.cameras.main.setBackgroundColor(OBP.PAL.ceu);
    this.map = this.make.tilemap({ data: this.m.dados, tileWidth: 32, tileHeight: 32 });
    const ts = this.map.addTilesetImage('tiles', 'tiles', 32, 32, 0, 0);
    this.camada = this.map.createLayer(0, ts, 0, 0);
    this.camada.setCollision([0, 1, 2, 3, 4, 6]); // 5 (espinho) não colide
    this.camada.forEachTile(t => { if (t.index === 1) { t.collideDown = false; t.collideLeft = false; t.collideRight = false; } });
    OBP.Audio.init(this); OBP.Voice.init(this, this.heroiId);
    this.criarEntidades();
    this.inp = new OBP.Input(this);
    this.cam = new OBP.Camera(this, this.player, this.map.widthInPixels, this.map.heightInPixels);
    this.parada = 0; this.controle = true;
    this.debugSoco = this.add.graphics().setDepth(100);
    this.input.keyboard.on('keydown-F1', () => this.alternarDebug());
    this.registry.set('coracoes', OBP.CFG.CORACOES);
    this.scene.launch('Hud');
    this.events.once('shutdown', () => this.scene.stop('Hud'));
  }
  criarEntidades() {
    OBP.Blocos.criarTexturas(this); OBP.Hud.criarTexturas(this);
    const P = this.m.entidades.find(e => e.ch === 'P');
    const x = this.checkpoint ? this.checkpoint.x : P.col * 32 + 16, y = this.checkpoint ? this.checkpoint.y : (P.lin + 1) * 32;
    this.player = new OBP.Player(this, x, y, this.heroiId);
    this.blocos = new OBP.Blocos(this, this.camada);
    this.itens = new OBP.Itens(this, this.camada);
    this.itens.criarDoMapa(this.m.entidades);
    this.physics.add.collider(this.player, this.camada, (p, tile) => this.blocos.cabecada(p, tile));
    this.physics.add.overlap(this.player, this.itens.grupo, (p, item) => this.itens.coletar(p, item), (p) => !p.morto);
    this.player.on('pulou', () => { OBP.Audio.pulo(); OBP.Voice.reacaoCada('pulo-01', 10); });
    this.player.on('socou', () => OBP.Audio.soco());
    this.player.on('pousouAlto', () => OBP.Audio.pouso());
    this.events.on('bloco-quebrado', () => { OBP.Audio.bloco(); OBP.Voice.reacaoCada('soco-01', 10); });
    this.events.on('saco', () => { OBP.Audio.verba(this.time.now); OBP.Voice.reacaoCada('moeda-01', 50); });
  }
  // hit stop: pausa física e animações por ms; o update devolve cedo enquanto durar
  pararTudo(ms) {
    this.parada = Math.max(this.parada, ms);
    this.physics.world.pause(); this.anims.pauseAll();
  }
  // F1 mostra as caixas (spec 2.5): corpos do Arcade em roxo e a caixa do soco em magenta
  alternarDebug() {
    const w = this.physics.world;
    if (!w.debugGraphic) { w.createDebugGraphic(); w.drawDebug = false; }
    w.drawDebug = !w.drawDebug;
    w.debugGraphic.setVisible(w.drawDebug);
    if (!w.drawDebug) w.debugGraphic.clear();
  }
  desenharDebug(caixa) {
    this.debugSoco.clear();
    if (this.physics.world.drawDebug && caixa) this.debugSoco.lineStyle(1, 0xff00ff).strokeRect(caixa.x, caixa.y, caixa.w, caixa.h);
  }
  update(t, dt) {
    if (this.parada > 0) {
      this.parada -= dt;
      if (this.parada <= 0) { this.physics.world.resume(); this.anims.resumeAll(); }
      return;
    }
    const inp = this.inp.ler();
    this.player.update(this.controle ? inp : OBP.Input.VAZIO, t, dt);
    this.blocos.update(t);
    this.cam.update();
    const caixa = this.player.socoCaixa();
    if (caixa) this.blocos.socar(caixa, this.player);
    this.desenharDebug(caixa);
  }
};
