// Herói: estados chão, ar, soco, dano, morte. Toda física vertical passa por OBP.Fisica (as mesmas funções do teste).
// Tempo de soco e de dano contam em ms e viram "frame lógico" de 60 fps (spec 3: f é frame lógico), então um monitor
// de 144 Hz não encurta o soco.
OBP.Player = class extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, xPe, yPe, heroiId) {
    super(scene, xPe, yPe, heroiId, OBP.FRAMES.idle);
    this.h = OBP.HEROIS[heroiId];
    scene.add.existing(this);
    scene.physics.add.existing(this);
    const c = this.h.celula, hb = this.h.hitbox;
    this.setOrigin(0.5, 1); // x,y do sprite é o pé (spec 2.4: pés na última linha da célula)
    this.body.setSize(hb.w, hb.h).setOffset((c - hb.w) / 2, c - hb.h); // hitbox centrada no pé (spec 2.5)
    this.body.setMaxVelocity(100000, 100000); // nunca setMaxVelocityY: o teto de queda é clamp em update
    this.dir = 1; this.estado = 'chao'; this.morto = false;
    this.ultChao = -1e9; this.ultAperto = -1e9; this.pausaRest = 0; this.pausou = false; this.cortou = false;
    this.socoMs = -1; this.acertados = new Set();
    this.feridoAte = 0; this.recuoAte = 0; this.invencivelAte = 0; this.quedaDe = yPe;
    this.criarAnims();
  }
  criarAnims() {
    const id = this.h.id, a = this.scene.anims;
    if (a.exists(`${id}-andar`)) return;
    // ciclo de andar da v1: 2-3-4-3 (decisão 31), a 12 fps tikinho e 10 fps gilpp
    a.create({ key: `${id}-andar`, frames: a.generateFrameNumbers(id, { frames: [8, 9, 10, 11, 12, 13, 14, 15] }), frameRate: this.h.andarFps, repeat: -1 });
  }
  socoFrame() { return this.socoMs < 0 ? -1 : Math.floor(this.socoMs * 60 / 1000); }
  socoCaixa() {
    const f = this.socoFrame(), s = this.h.soco;
    if (f < s.ativoDe || f > s.ativoAte) return null;
    const b = this.body;
    return { x: this.dir > 0 ? b.right : b.left - s.w, y: b.top + s.dy, w: s.w, h: s.h };
  }
  podeFerir() { return !this.morto && this.scene.time.now >= this.invencivelAte; }
  // dir: +1 empurra para a direita. atrasoMs: duração do hit stop, os relógios do recuo começam depois dele.
  ferir(dir, atrasoMs) {
    if (!this.podeFerir()) return false;
    const t = this.scene.time.now + atrasoMs;
    this.recuoAte = t + OBP.CFG.RECUO_MS; this.feridoAte = t + OBP.CFG.RECUO_MS; this.invencivelAte = t + OBP.CFG.INVENCIVEL_MS;
    this.body.setVelocity(dir * 160, -160);
    this.socoMs = -1;
    return true;
  }
  morrer() {
    this.morto = true;
    this.body.checkCollision.none = true; // atravessa o chão: voa e cai fora da tela
    this.body.setVelocity(-this.dir * 60, -420);
    this.body.setGravityY(1200);
    this.anims.stop(); this.setFrame(OBP.FRAMES.hurt); this.setVisible(true);
  }
  update(inp, t, dt) {
    if (this.morto) return;
    const b = this.body, h = this.h, F = OBP.Fisica, s = dt / 1000;
    const noChao = b.blocked.down;
    if (noChao) {
      this.ultChao = t;
      if (this.estado === 'ar') { if (this.quedaDe !== null && this.y - this.quedaDe > 64) this.emit('pousouAlto'); this.estado = 'chao'; }
      this.pausou = false; this.cortou = false; this.pausaRest = 0; this.quedaDe = null;
    } else if (this.estado === 'chao') { this.estado = 'ar'; this.quedaDe = this.y; }
    if (!noChao && this.quedaDe !== null) this.quedaDe = Math.min(this.quedaDe, this.y);
    const travado = t < this.recuoAte;
    // horizontal: aceleração e freio por herói; no chão o soco para o herói (Alex Kidd zera a velocidade no soco)
    let alvo = 0;
    if (!travado) { if (inp.esq) alvo = -h.vel; else if (inp.dir) alvo = h.vel; }
    if (this.socoMs >= 0 && noChao) alvo = 0;
    if (!travado) b.setVelocityX(F.andar(b.velocity.x, alvo, h, s));
    if (alvo !== 0) { this.dir = Math.sign(alvo); this.setFlipX(this.dir < 0); }
    // pulo: buffer + coyote; tikinho cancela o soco a partir de f4 (gilpp nunca)
    if (inp.puloAgora && !travado) this.ultAperto = t;
    const socoLivre = this.socoMs < 0 || this.socoFrame() >= h.soco.cancelaEm;
    if (!travado && socoLivre && F.podePular(t, this.ultChao, this.ultAperto, h)) {
      b.setVelocityY(-h.v0); this.y -= OBP.CFG.DECOLAGEM; // decolagem já 4 px no ar
      this.ultChao = -1e9; this.ultAperto = -1e9; this.socoMs = -1; this.estado = 'ar';
      this.pausou = false; this.cortou = false; this.quedaDe = this.y;
      this.emit('pulou');
    }
    if (inp.puloSoltou && !this.cortou && b.velocity.y < 0) { b.setVelocityY(F.cortar(b.velocity.y)); this.cortou = true; }
    // gravidade por fase do pulo, pausa no ápice uma vez por pulo, teto de queda por clamp
    if (!noChao && !this.pausou && Math.abs(b.velocity.y) < OBP.CFG.APICE_V) { this.pausaRest = h.apiceMs / 1000; this.pausou = true; }
    b.setGravityY(F.gravidade(h, b.velocity.y, this.pausaRest));
    if (this.pausaRest > 0) this.pausaRest -= s;
    if (b.velocity.y > OBP.CFG.TERMINAL) b.setVelocityY(F.terminal(b.velocity.y));
    // soco: começa em f0, hitbox nos frames ativos, termina em h.soco.frames
    if (inp.socoAgora && this.socoMs < 0 && !travado) { this.socoMs = 0; this.acertados.clear(); this.emit('socou'); }
    else if (this.socoMs >= 0) { this.socoMs += dt; if (this.socoFrame() >= h.soco.frames) this.socoMs = -1; }
    this.animar(noChao, t);
  }
  animar(noChao, t) {
    const F = OBP.FRAMES, b = this.body;
    // invencível pisca por visibilidade (alpha parcial é proibido, spec 2.3): 4 f ligado, 4 f desligado
    this.setVisible(t >= this.invencivelAte || Math.floor(t / 66) % 2 === 0);
    if (t < this.feridoAte) { this.anims.stop(); this.setFrame(F.hurt); return; }
    if (this.socoMs >= 0) { this.anims.stop(); this.setFrame(F.punch); return; }
    if (!noChao) { this.anims.stop(); this.setFrame(b.velocity.y < 0 ? F.jump : F.fall); return; }
    if (Math.abs(b.velocity.x) > 8) this.play(`${this.h.id}-andar`, true);
    else { this.anims.stop(); this.setFrame(F.idle); }
  }
};
