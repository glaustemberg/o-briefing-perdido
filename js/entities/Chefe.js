// O Sobrinho na arena (decisao 85). Depois de perder o jokenpo ele luta em duas partes, uma de cada Alex Kidd:
// 1. a CABECA sai do corpo e quica pela sala em arcos enquanto o corpo fica parado (Miracle World de 1986, tres
//    socos na cabeca); 2. a cabeca volta e o corpo joga BATATAS que quicam pela sala, mastiga, e pula para o
//    outro lado (o padrao do Gooseka no DX de 2021, quatro acertos). Vida total 7, uma batata da placa por acerto.
// Os tres (chefe, cabeca, batata) moram no grupo `inimigos` do Level e falam a mesma lingua dos inimigos comuns:
// tipo, morto, invencivel, fere, update(t) e morrer(dir, knockback), que aqui e "levou um golpe".
OBP.Chefe = class extends Phaser.Physics.Arcade.Sprite {
  static criarTexturas(scene) {
    const P = OBP.PAL;
    OBP.pixels(scene, 'proj-batata', [
      '.....######.....',
      '...##oooooo##...',
      '..#ooaaaaaaoo#..',
      '.#oaaaaaaaaaao#.',
      '#oaaaaooaaaaaao#',
      '#oaaaaooaaaaaao#',
      '#oaaaaaaaaaooao#',
      '.#oaaaaaaaaooo#.',
      '..#ooaaaaaooo#..',
      '...##ooooo##....',
      '.....######.....',
      '................',
    ], { '#': P.contorno, 'o': P.laranja, 'a': P.moeda });
  }
  constructor(scene, x, yPe) {
    super(scene, x, yPe, 'sobrinho', 0);
    this.setOrigin(0.5, 1);
    scene.add.existing(this); scene.physics.add.existing(this);
    this.tipo = 'chefe'; this.morto = false; this.invencivel = true; this.fere = false;   // no jokenpo ninguem se toca
    this.body.setSize(40, 76).setOffset(28, 20);
    this.fase = 'espera'; this.vida = this.vidaTotal();
    this.proximo = 0; this.acao = 0; this.n = 0; this.imuneAte = 0; this.fisicaOk = false;
    this.d = OBP.dif(scene.registry);
    this.setFlipX(true);   // a tira olha para a direita; o heroi nasce a esquerda
  }
  vidaTotal() { return OBP.CHEFE.VIDA_CABECA + OBP.CHEFE.VIDA_CORPO; }
  // o PhysicsGroup zera gravidade e velocidade de quem entra nele (ver Enemy.aplicarFisica)
  aplicarFisica() { this.fisicaOk = true; this.body.setAllowGravity(true); this.body.setGravityY(1000); }
  // chamado pela cena do jokenpo quando o heroi fecha a melhor de 3
  iniciarLuta() {
    this.fase = 'solta'; this.proximo = this.scene.time.now + 700; this.setFrame(1);
    this.scene.vidaChefe(this.vida, this.vidaTotal());
  }
  update(t) {
    if (!this.fisicaOk) this.aplicarFisica();
    if (this.fase === 'espera' || this.fase === 'derrotado') return;
    const s = this.scene, b = this.body, p = s.player;
    this.setFlipX(p.x < this.x);
    this.setVisible(t < this.imuneAte ? Math.floor(t / 60) % 2 === 0 : true);
    if (this.fase === 'solta') { if (t >= this.proximo) this.soltarCabeca(t); return; }
    if (this.fase === 'cabeca') { if (this.vida <= OBP.CHEFE.VIDA_CORPO) this.recuperarCabeca(t); return; }
    if (this.fase === 'volta') {
      if (t >= this.proximo) { this.fase = 'batata'; this.fere = true; this.invencivel = false; this.acao = 0; this.proximo = t + 600; this.setFrame(0); }
      return;
    }
    // fase 'batata', rodizio fixo: parado, tell (aponta), 3 arremessos, mastiga (janela de soco), pula para o outro lado
    const R = this.d.ritmo;
    if (this.acao === 0 && t >= this.proximo) { this.acao = 1; this.proximo = t + 400 * R; this.setFrame(1); }
    else if (this.acao === 1 && t >= this.proximo) { this.acao = 2; this.n = 0; this.proximo = t; }
    else if (this.acao === 2 && t >= this.proximo) {
      this.arremessar(); this.n++; this.proximo = t + 350 * R;
      if (this.n >= OBP.CHEFE.BATATAS) { this.acao = 3; this.proximo = t + 1500 * R; this.setFrame(7); }
    } else if (this.acao === 3 && t >= this.proximo) {
      this.acao = 4; this.proximo = t + 300;
      const alvo = this.x < 320 ? 496 : 144;
      b.setVelocity((alvo - this.x) / 0.9, -460); this.setFrame(4);
      OBP.Audio.pulinho();
    } else if (this.acao === 4 && t >= this.proximo && b.blocked.down) {
      b.setVelocityX(0); this.acao = 0; this.proximo = t + 500 * R; this.setFrame(0); OBP.Audio.pouso();
    }
  }
  arremessar() {
    const s = this.scene, dir = s.player.x < this.x ? -1 : 1;
    // tres arcos de alcance diferente, para o heroi nao ter um ponto seguro parado
    const vx = dir * (150 + 55 * this.n) * this.d.vel;
    s.inimigos.add(new OBP.Batata(s, this.x + dir * 20, this.y - 60, vx, -380));
    OBP.Audio.arremesso();
    if (this.n === 0) OBP.VozInimigo.falar(s, 'chefe', { variantes: 2 });
  }
  soltarCabeca(t) {
    const s = this.scene;
    this.fase = 'cabeca'; this.setTexture('sob-corpo'); this.body.setSize(32, 40).setOffset(8, 8);
    this.fere = false; this.invencivel = true;
    this.cabeca = new OBP.Cabeca(s, this.x, this.y - 70, this);
    s.inimigos.add(this.cabeca);
    OBP.Audio.acordar(); OBP.VozInimigo.falar(s, 'chefe', { variantes: 2, prioritaria: true });
  }
  recuperarCabeca(t) {
    this.fase = 'volta'; this.setTexture('sobrinho', 5); this.body.setSize(40, 76).setOffset(28, 20);
    this.proximo = t + 900; OBP.Audio.pouso();
  }
  // soco ou tiro no corpo: so vale na fase das batatas e fora da piscada de imunidade
  morrer(dir) {
    if (this.fase !== 'batata' || this.scene.time.now < this.imuneAte) return;
    this.imuneAte = this.scene.time.now + 500; this.setFrame(5); this.x += dir * 6;
    this.golpe(dir);
  }
  // um acerto em qualquer parte dele (a cabeca tambem chama aqui)
  golpe(dir) {
    const s = this.scene;
    this.vida--; s.vidaChefe(this.vida, this.vidaTotal());
    OBP.Audio.dano(); OBP.Pedacos.spawn(s, this.x, this.y - 40, 'estrela32');
    s.cameras.main.shake(83, new Phaser.Math.Vector2(2 / 640, 2 / 360));
    if (this.vida <= 0) this.derrotar(); else OBP.Voice.falarUma(['ccabeca-01', 'ccabeca-02']);
  }
  derrotar() {
    const s = this.scene;
    this.fase = 'derrotado'; this.fere = false; this.invencivel = true;
    this.setTexture('sobrinho', 6); this.setVisible(true); this.body.setVelocity(0, 0);
    for (const e of [...s.inimigos.getChildren()]) if (e.tipo === 'batata') e.destroy();
    OBP.Audio.morteInimigo(); OBP.Audio.explosao();
    s.cameras.main.shake(250, new Phaser.Math.Vector2(4 / 640, 4 / 360));
    s.time.delayedCall(1500, () => s.concluir());
  }
};

// A cabeca solta: gravidade forte e quique cheio, o apice devolvido a cada toque no chao para o arco ser sempre
// o mesmo e o jogador conseguir ler onde ela cai. Cada soco tira 1 e a deixa mais rapida.
OBP.Cabeca = class extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, dono) {
    super(scene, x, y, 'sob-cabeca');
    scene.add.existing(this); scene.physics.add.existing(this);
    this.tipo = 'cabeca'; this.dono = dono; this.morto = false; this.invencivel = false; this.fere = true;
    this.vida = OBP.CHEFE.VIDA_CABECA; this.fisicaOk = false; this.imuneAte = 0; this.morreuEm = 0;
    this.vel = 120 * dono.d.vel; this.dir = scene.player.x < x ? -1 : 1;
    this.body.setSize(32, 30).setOffset(8, 8);
  }
  aplicarFisica() {
    this.fisicaOk = true; const b = this.body;
    b.setAllowGravity(true); b.setGravityY(1280); b.setBounce(1, 1); b.setVelocity(this.dir * this.vel, -640);
  }
  update(t) {
    if (!this.fisicaOk) this.aplicarFisica();
    const b = this.body;
    if (this.morto) { if (OBP.Pedacos.passo(this, this.morreuEm, t)) this.destroy(); return; }
    // a parede inverte pelo quique; o atrito do chao e que nao pode frear
    if (Math.abs(b.velocity.x) < this.vel * 0.9) b.setVelocityX((Math.sign(b.velocity.x) || this.dir) * this.vel);
    if (b.blocked.down) { b.setVelocityY(-640); OBP.Audio.quique(); }
    this.setVisible(t < this.imuneAte ? Math.floor(t / 60) % 2 === 0 : true);
    this.setFlipX(b.velocity.x > 0);
  }
  morrer(dir) {
    const t = this.scene.time.now;
    if (t < this.imuneAte) return;
    this.vida--; this.imuneAte = t + 500; this.vel += 60 * this.dono.d.vel;
    this.body.setVelocity(dir * this.vel, -400);
    this.dono.golpe(dir);
    if (this.vida <= 0) {
      this.morto = true; this.morreuEm = t; this.fere = false; this.invencivel = true;
      this.body.setBounce(0, 0); this.body.setVelocity(dir * 200, -300);
    }
  }
};

// Batata frita arremessada: arco, quica no chao perdendo altura, some no quarto quique ou em 5 s. Um soco a
// destroi, para o jogador ter o que fazer alem de desviar.
OBP.Batata = class extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, vx, vy) {
    super(scene, x, y, 'proj-batata');
    scene.add.existing(this); scene.physics.add.existing(this);
    this.tipo = 'batata'; this.morto = false; this.invencivel = false; this.fere = true; this.fisicaOk = false;
    this.vx = vx; this.vy = vy; this.quiques = 0; this.ultimoQuique = 0; this.nasceu = scene.time.now; this.morreuEm = 0;
    this.body.setSize(12, 10).setOffset(2, 1);
  }
  aplicarFisica() {
    this.fisicaOk = true; const b = this.body;
    b.setAllowGravity(true); b.setGravityY(900); b.setBounce(1, 0.6); b.setVelocity(this.vx, this.vy);
  }
  update(t) {
    if (!this.fisicaOk) this.aplicarFisica();
    if (this.morto) { if (OBP.Pedacos.passo(this, this.morreuEm, t)) this.destroy(); return; }
    const b = this.body;
    if (b.blocked.down && t - this.ultimoQuique > 100) { this.ultimoQuique = t; this.quiques++; OBP.Audio.quique(); }
    if (this.quiques >= 4 || t - this.nasceu > 5000) { this.destroy(); return; }
    this.setFlipX(b.velocity.x < 0);
  }
  morrer(dir, knockback) {
    this.morto = true; this.morreuEm = this.scene.time.now; this.fere = false; this.invencivel = true;
    this.body.setBounce(0, 0); this.body.setVelocity(dir * knockback, -200);
    OBP.Audio.morteInimigo(); OBP.Voice.falarUma(['cbatata-01', 'cbatata-02']);
  }
};
