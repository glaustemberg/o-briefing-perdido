// Level: monta a fase a partir do ASCII, instancia o herói e roda o loop. Blocos, itens, inimigos, HUD, dano,
// checkpoint e saída entram nas Tasks 5 a 9 modificando esta cena.
OBP.Level = class extends Phaser.Scene {
  constructor() { super('Level'); }
  init(data) {
    this.faseId = (data && data.fase) || 'fase-01';
    this.checkpoint = (data && data.checkpoint) || null;
    // o prazo atravessa a morte: voltar ao checkpoint não devolve tempo (senão morrer de propósito vira estratégia)
    this.prazoMs = (data && data.prazoMs != null) ? data.prazoMs : (OBP.PRAZOS[this.faseId] || 180) * 1000;
    this.prazoEstourou = this.prazoMs <= 0;
    this.heroiId = this.registry.get('heroi') || 'tikinho';
    this.checkpointAtivo = !!this.checkpoint;
    this.concluida = false; this.podeSair = false;
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
    // fundo da fase: fica parado na tela e anda pela tilePosition, entao repete para sempre sem acabar no fim do mapa
    const arte = this.faseId.replace(/[ab]$/, '');   // fase-08a e fase-08b usam a arte de fase-08
    if (this.textures.exists('fundo-' + arte)) {
      const alt = this.textures.get('fundo-' + arte).getSourceImage().height;
      this.fundo = this.add.tileSprite(0, 0, 640, 360, 'fundo-' + arte).setOrigin(0).setScrollFactor(0).setDepth(-10);
      this.fundo.tilePositionY = Math.max(0, alt - 360);   // ancora no pe da parede
    }
    this.map = this.make.tilemap({ data: this.m.dados, tileWidth: 32, tileHeight: 32 });
    const chaveTiles = this.textures.exists('tiles-' + arte) ? 'tiles-' + arte : 'tiles';
    const ts = this.map.addTilesetImage(chaveTiles, chaveTiles, 32, 32, 0, 0);
    this.camada = this.map.createLayer(0, ts, 0, 0);
    // '#' com outro solido em cima vira parede interna (7); o tile 0 tem rodape claro e so serve de piso exposto
    if (this.textures.get(chaveTiles).getSourceImage().width >= 256) {
      this.camada.forEachTile(t => {
        if (t.index !== 0) return;
        const acima = this.camada.getTileAt(t.x, t.y - 1);
        if (acima && [0, 2, 3, 4, 6, 7].includes(acima.index)) t.index = 7;
      });
    }
    this.camada.setCollision([0, 1, 2, 3, 4, 6, 7]); // 5 (espinho) não colide
    this.camada.forEachTile(t => { if (t.index === 1) { t.collideDown = false; t.collideLeft = false; t.collideRight = false; } });
    OBP.Audio.init(this); OBP.Voice.init(this, this.heroiId);
    this.criarEntidades();
    this.inp = new OBP.Input(this);
    this.cam = new OBP.Camera(this, this.player, this.map.widthInPixels, this.map.heightInPixels);
    this.parada = 0; this.controle = false; this.morrendo = false;
    // iris de entrada simplificada em fade (300 ms); a fala de inicio toca no primeiro frame de controle
    this.cameras.main.once('camerafadeincomplete', () => {
      this.controle = true;
      OBP.Voice.falar(this.checkpoint ? 'inicio-01' : 'inicio-f1');
    });
    this.cameras.main.fadeIn(300, 0, 0, 0);
    this.mostrarNome();
    this.debugSoco = this.add.graphics().setDepth(100);
    this.input.keyboard.on('keydown-F1', () => this.alternarDebug());
    this.registry.set('coracoes', this.registry.get('coracoesMax'));
    this.registry.set('prazo', Math.ceil(this.prazoMs / 1000));
    this.scene.launch('Hud');
    this.events.once('shutdown', () => {
      this.scene.stop('Hud');
      // this.events (sys.events) sobrevive a reinicios da mesma cena; sem isso os listeners de criarEntidades()
      // dobram a cada volta Level -> Select -> Level (ou respawn da Task 8).
      this.events.off('bloco-quebrado');
      this.events.off('lampada');
    });
  }
  criarEntidades() {
    OBP.Blocos.criarTexturas(this); OBP.Hud.criarTexturas(this);
    const P = this.m.entidades.find(e => e.ch === 'P');
    const x = this.checkpoint ? this.checkpoint.x : P.col * 32 + 16, y = this.checkpoint ? this.checkpoint.y : (P.lin + 1) * 32;
    this.player = new OBP.Player(this, x, y, this.heroiId);
    // armadura comprada na loja ou herdada da fase anterior: o registry manda, o sprite obedece
    if (OBP.Armadura.vestida(this.registry.get('coracoesExtra'))) this.player.vestirArmadura(true);
    this.blocos = new OBP.Blocos(this, this.camada);
    this.itens = new OBP.Itens(this, this.camada);
    this.itens.criarDoMapa(this.m.entidades, this.checkpointAtivo);
    this.projeteis = new OBP.Projeteis(this, this.camada);
    this.criarInimigos();
    this.physics.add.collider(this.player, this.camada, (p, tile) => this.blocos.cabecada(p, tile));
    this.physics.add.overlap(this.player, this.itens.grupo, (p, item) => this.itens.coletar(p, item), (p) => !p.morto);
    this.player.on('pulou', () => { OBP.Audio.pulo(); OBP.Voice.reacaoCada('pulo-01', 10); });
    this.player.on('socou', () => OBP.Audio.soco());
    this.player.on('atirou', () => { if (this.projeteis.lancar(this.player)) OBP.Audio.tiro(); });
    this.player.on('pousouAlto', () => OBP.Audio.pouso());
    this.events.on('bloco-quebrado', () => { OBP.Audio.bloco(); OBP.Voice.reacaoCada('soco-01', 10); });
    this.events.on('lampada', () => { OBP.Audio.verba(this.time.now); OBP.Voice.reacaoCada('moeda-01', 50); });
  }
  criarInimigos() {
    const lista = OBP.FASES[this.faseId].inimigos;
    this.inimigos = this.physics.add.group();
    for (const e of this.m.entidades) {
      if (!'123'.includes(e.ch)) continue;
      const tipo = lista[Number(e.ch) - 1];
      if (!OBP.INIMIGOS[tipo]) { console.warn('inimigo do M3 ainda não implementado, pulando:', tipo); continue; }
      const dy = OBP.INIMIGOS[tipo].dy || 0;
      this.inimigos.add(new OBP.Enemy(this, e.col * 32 + 16, Math.max(16, e.lin * 32 + 16 + dy), tipo));
    }
    this.physics.add.collider(this.inimigos, this.camada, null, (e) => !e.morto);
    this.physics.add.overlap(this.player, this.inimigos, (p, e) => this.contatoInimigo(e), (p, e) => !e.morto && !p.morto && e.fere);
    // projétil mata inimigo comum em 1 acerto, igual ao soco (adendo 6); hazard invencível só consome o projétil
    this.physics.add.overlap(this.projeteis.grupo, this.inimigos, (p, e) => {
      if (!e.invencivel) e.morrer(Math.sign(p.body.velocity.x) || 1, this.player.h.knockback);
      p.destroy();
    }, (p, e) => !e.morto);
  }
  contatoInimigo(e) {
    this.ferirJogador(Math.sign(this.player.x - e.x) || 1);
  }
  // toque de inimigo ou espinho: 1 coração, hit stop 100 ms, recuo 6 f, shake 4 px por 100 ms, invencível 60 f.
  // Com armadura, o coração extra é gasto primeiro e o normal nem é tocado (adendo 6).
  ferirJogador(dir) {
    if (this.morrendo || !this.player.ferir(dir, OBP.CFG.HITSTOP_DANO_MS)) return;
    const r = OBP.Armadura.dano(this.registry.get('coracoes'), this.registry.get('coracoesExtra'));
    this.registry.set({ coracoes: r.coracoes, coracoesExtra: r.extra });
    if (!OBP.Armadura.vestida(r.extra)) this.player.vestirArmadura(false);
    OBP.Audio.dano();
    this.pararTudo(OBP.CFG.HITSTOP_DANO_MS);
    this.cameras.main.shake(100, new Phaser.Math.Vector2(4 / 640, 4 / 360));
    if (r.coracoes <= 0) this.matar(); else OBP.Voice.falar('dano-01');
  }
  // soco no inimigo: mata, voa no knockback do herói, hit stop do herói (40 ms tikinho, 60 gilpp)
  socarInimigos(caixa) {
    const r = new Phaser.Geom.Rectangle(caixa.x, caixa.y, caixa.w, caixa.h), h = this.player.h;
    for (const e of this.inimigos.getChildren()) {
      if (e.morto || e.invencivel || this.player.acertados.has(e)) continue;
      const b = e.body;
      if (Phaser.Geom.Intersects.RectangleToRectangle(r, new Phaser.Geom.Rectangle(b.x, b.y, b.width, b.height))) {
        this.player.acertados.add(e);
        e.morrer(this.player.dir, h.knockback);
        this.pararTudo(h.hitStop);
      }
    }
  }
  // espinho (tile 5) não colide: fere por sobreposição com a hitbox do herói
  checarEspinhos() {
    const b = this.player.body;
    const t = this.camada.getTilesWithinWorldXY(b.x, b.y, b.width, b.height, { isNotEmpty: true }).find(x => x.index === 5);
    if (t) this.ferirJogador(Math.sign(this.player.x - t.getCenterX()) || 1);
  }
  // morte: voa e cai 1,2 s, fade 300 ms, volta ao checkpoint com 3 corações; sem vidas, game over mínimo do M1
  matar() {
    if (this.morrendo) return;
    this.morrendo = true; this.controle = false;
    this.registry.set({ coracoes: 0, coracoesExtra: 0 });
    this.registry.inc('vidas', -1);
    this.player.morrer();
    OBP.Audio.morte(); OBP.Voice.falar('morte-01');
    this.time.delayedCall(1200, () => {
      this.cameras.main.once('camerafadeoutcomplete', () => this.reiniciar());
      this.cameras.main.fadeOut(300, 0, 0, 0);
    });
  }
  reiniciar() {
    if (this.registry.get('vidas') > 0) { this.scene.restart({ fase: this.faseId, checkpoint: this.checkpoint, prazoMs: this.prazoMs }); return; }
    this.cameras.main.resetFX();
    this.add.rectangle(320, 180, 640, 360, OBP.PAL.num(OBP.PAL.contorno)).setScrollFactor(0).setDepth(200);
    this.add.text(320, 164, 'ACABOU O JOB', OBP.estiloTexto(16, OBP.PAL.coracao)).setOrigin(0.5).setScrollFactor(0).setDepth(201);
    this.add.text(320, 196, `LÂMPADAS ${String(this.registry.get('lampadas')).padStart(5, '0')}`, OBP.estiloTexto(8, OBP.PAL.cinzaClaro)).setOrigin(0.5).setScrollFactor(0).setDepth(201);
    // continue ilimitado: início da fase, 3 vidas, lâmpadas 0 (spec 4). Game over também zera o que foi comprado
    // na loja (coração permanente, pulo duplo, armadura e item guardado): o continue mantém só o herói.
    this.registry.set({
      vidas: OBP.CFG.VIDAS, lampadas: 0, coracoesMax: OBP.CFG.CORACOES, coracoesExtra: 0,
      pulosExtra: 0, itemGuardado: null,
    });
    this.time.delayedCall(2000, () => this.scene.restart({ fase: this.faseId, checkpoint: null, prazoMs: null }));
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
  mostrarNome() {
    const t = this.add.text(320, 120, OBP.FASES[this.faseId].nome, OBP.estiloTexto(16, OBP.PAL.branco)).setOrigin(0.5).setScrollFactor(0).setDepth(150);
    this.time.delayedCall(1500, () => t.destroy());
  }
  ativarCheckpoint(item) {
    this.checkpointAtivo = true;
    item.setTexture('check-on');
    this.checkpoint = { x: item.x, y: item.y + 16 }; // pe do heroi na base do tile da bandeira
    OBP.Audio.checkpoint(); OBP.Voice.falar('check-01');
  }
  // coxinha (spec 4): fecha a fase, coracoes cheios, fala de vitoria; os segundos que sobraram viram lampadas
  // (1 s = 1 lampada, adendo 2) e a pontuacao da corrida e comparada com o recorde da dupla fase mais heroi.
  concluir() {
    if (this.concluida || this.morrendo) return;
    this.concluida = true; this.controle = false;
    this.registry.set('coracoes', this.registry.get('coracoesMax'));
    OBP.Audio.item(); OBP.Voice.falar('vitfase-01');
    this.bonus = OBP.Relogio.bonus(this.prazoMs / 1000);
    this.pontos = OBP.Save.pontuacao(this.registry.get('lampadas'), this.bonus);
    this.registry.set('lampadas', this.pontos); // o bonus entra no mesmo contador, nao num segundo saldo
    this.recorde = OBP.Save.gravar(this.faseId, this.heroiId, this.pontos);
    const P = OBP.PAL, n = v => String(Math.max(0, v)).padStart(5, '0');
    const linha = (y, txt, tam, cor) => this.add.text(320, y, txt, OBP.estiloTexto(tam, cor)).setOrigin(0.5).setScrollFactor(0).setDepth(201);
    this.add.rectangle(320, 180, 460, 160, P.num(P.contorno)).setStrokeStyle(2, P.num(P.branco)).setScrollFactor(0).setDepth(200);
    linha(118, 'FASE CONCLUÍDA', 16, P.moeda);
    linha(146, `LÂMPADAS ${n(this.pontos - this.bonus)}`, 8, P.branco);
    linha(164, `BÔNUS DE TEMPO ${n(this.bonus)}`, 8, P.branco);
    linha(188, `PONTUAÇÃO ${n(this.pontos)}`, 16, P.moeda);
    linha(212, this.recorde ? 'NOVO RECORDE' : `RECORDE ${n(OBP.Save.ler(this.faseId, this.heroiId))}`, 8, this.recorde ? P.verdeClaro : P.cinzaClaro);
    linha(240, 'ENTER VAI À LOJA', 8, P.cinzaClaro);
    this.time.delayedCall(600, () => { this.podeSair = true; });
  }
  // O registry só é escrito quando o segundo inteiro muda: mandar float a 60 Hz dispara changedata 60 vezes por
  // segundo e o Hud redesenharia o texto à toa.
  contarPrazo(dt) {
    if (!this.controle || this.concluida || this.morrendo) return;
    const antes = Math.ceil(this.prazoMs / 1000);
    this.prazoMs -= dt;
    const agora = Math.ceil(this.prazoMs / 1000);
    if (agora !== antes) this.registry.set('prazo', agora);
    if (!this.prazoEstourou && this.prazoMs <= 0) { this.prazoEstourou = true; OBP.Audio.prazoEsgotado(); }
  }
  update(t, dt) {
    if (this.parada > 0) {
      this.parada -= dt;
      if (this.parada <= 0) { this.physics.world.resume(); this.anims.resumeAll(); }
      return;
    }
    const inp = this.inp.ler();
    this.contarPrazo(dt);
    if (this.concluida && this.podeSair && (inp.startAgora || inp.puloAgora)) { this.scene.start('Shop', { fase: this.faseId }); return; }
    this.player.update(this.controle ? inp : OBP.Input.VAZIO, t, dt);
    for (const e of [...this.inimigos.getChildren()]) e.update(t, dt);
    this.blocos.update(t);
    this.projeteis.update();
    this.cam.update();
    if (this.fundo) this.fundo.tilePositionX = this.cameras.main.scrollX * 0.4;  // parallax do fundo
    if (this.morrendo) return;
    const caixa = this.player.socoCaixa();
    if (caixa) { this.blocos.socar(caixa, this.player); this.socarInimigos(caixa); }
    this.checarEspinhos();
    if (this.player.y > this.map.heightInPixels + 64) this.matar(); // buraco mata direto
    this.desenharDebug(caixa);
  }
};
