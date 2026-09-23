// Herói: estados chão, ar, soco, dano, morte. Toda física vertical passa por OBP.Fisica (as mesmas funções do teste).
// Tempo de soco e de dano contam em ms e viram "frame lógico" de 60 fps (spec 3: f é frame lógico), então um monitor
// de 144 Hz não encurta o soco.
OBP.Player = class extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, xPe, yPe, heroiId) {
    super(scene, xPe, yPe, heroiId, OBP.FRAMES.idle);
    this.h = OBP.HEROIS[heroiId];
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setOrigin(0.5, 1); // x,y do sprite é o pé (spec 2.4: pés na última linha da célula)
    this.body.setMaxVelocity(100000, 100000); // nunca setMaxVelocityY: o teto de queda é clamp em update
    this.armadura = false; this.tiroAte = 0;
    this.dir = 1; this.estado = 'chao'; this.morto = false; this.agachado = false;
    this.ajustarCorpo(); // hitbox centrada no pé (spec 2.5), com o offset saindo da célula em uso
    this.ultChao = -1e9; this.ultAperto = -1e9; this.pausaRest = 0; this.pausou = false; this.cortou = false;
    this.socoMs = -1; this.acertados = new Set();
    this.feridoAte = 0; this.recuoAte = 0; this.invencivelAte = 0; this.quedaDe = yPe;
    this.criarAnims();
  }
  // A forma de armadura tem célula maior (96 e 128) mas a mesma hitbox (24x52 e 28x68). Só o offset muda: física,
  // colisão e altura de pulo ficam idênticas, como manda o adendo 6. Também cobre o agachado (spec 53): a hitbox
  // agachada de cada herói vale nas duas formas, só a célula base muda.
  ajustarCorpo() {
    const h = this.h, c = this.armadura ? h.celulaArmadura : h.celula, hb = this.agachado ? h.hitboxAgachado : h.hitbox;
    this.body.setSize(hb.w, hb.h);
    this.body.setOffset((c - hb.w) / 2, c - hb.h);
  }
  frames() { return this.armadura ? OBP.FRAMES_ARMADURA : OBP.FRAMES; }
  animPrefixo() { return this.armadura ? this.h.armaduraId : this.h.id; }
  vestirArmadura(on) {
    if (this.armadura === on) return;
    this.armadura = on;
    this.setTexture(on ? this.h.armaduraId : this.h.id, this.frames().idle);
    this.ajustarCorpo();
    this.criarAnims();
  }
  criarAnims() {
    const a = this.scene.anims, h = this.h;
    if (!a.exists(`${h.id}-andar`)) {
      // ciclo de andar da v1: 2-3-4-3 (decisão 31), a 12 fps tikinho e 10 fps gilpp
      a.create({ key: `${h.id}-andar`, frames: a.generateFrameNumbers(h.id, { frames: [8, 9, 10, 11, 12, 13, 14, 15] }), frameRate: h.andarFps, repeat: -1 });
      // deslizar agachado: alterna a pose parada e a do pe a frente (decisao 53)
      a.create({ key: `${h.id}-deslizar`, frames: a.generateFrameNumbers(h.id, { frames: [OBP.FRAMES.crouch, OBP.FRAMES.crouchStep] }), frameRate: 6, repeat: -1 });
    }
    const A = OBP.FRAMES_ARMADURA;
    if (!a.exists(`${h.armaduraId}-andar`)) {
      // ciclo de 4 tempos com a pose parada de passagem (decisao 68): so walkA/walkC, as duas com a perna aberta,
      // lia como deslizar. Contato, passagem, contato, passagem e a caminhada classica de 2 poses.
      a.create({ key: `${h.armaduraId}-andar`, frames: a.generateFrameNumbers(h.armaduraId, { frames: [A.walkA, A.idle, A.walkC, A.idle] }), frameRate: h.andarArmaduraFps, repeat: -1 });
      // deslizar agachado da armadura: mesmo par crouch/crouchStep, na tira de 8 quadros
      a.create({ key: `${h.armaduraId}-deslizar`, frames: a.generateFrameNumbers(h.armaduraId, { frames: [A.crouch, A.crouchStep] }), frameRate: 6, repeat: -1 });
    }
  }
  socoFrame() { return this.socoMs < 0 ? -1 : Math.floor(this.socoMs * 60 / 1000); }
  socoCaixa() {
    const f = this.socoFrame(), s = this.h.soco;
    if (f < s.ativoDe || f > s.ativoAte) return null;
    const b = this.body;
    return { x: this.dir > 0 ? b.right : b.left - s.w, y: b.top + s.dy, w: s.w, h: s.h };
  }
  podeFerir() { return !this.morto && this.scene.time.now >= Math.max(this.invencivelAte, this.carimboAte || 0); }
  // cafe e energetico (decisao 86): 1,4x ate velAte; carimbo APROVADO: invencivel ate carimboAte, brilhando roxo
  fatorVel(t) { return t < (this.velAte || 0) ? OBP.EFEITOS.cafe.fator : 1; }
  // dir: +1 empurra para a direita. atrasoMs: duração do hit stop, os relógios do recuo começam depois dele.
  ferir(dir, atrasoMs) {
    if (!this.podeFerir()) return false;
    const t = this.scene.time.now + atrasoMs;
    this.recuoAte = t + OBP.CFG.RECUO_MS; this.feridoAte = t + OBP.CFG.RECUO_MS; this.invencivelAte = t + OBP.dif(this.scene.registry).invencivelMs;
    this.body.setVelocity(dir * 160, -160);
    this.socoMs = -1;
    return true;
  }
  morrer() {
    if (this.morto) return; // idempotente: buraco e 0 corações podem chamar no mesmo frame
    this.morto = true;
    this.body.checkCollision.none = true; // atravessa o chão: voa e cai fora da tela
    this.body.setVelocity(-this.dir * 60, -420);
    this.body.setGravityY(1200);
    this.anims.stop(); this.setFrame(this.frames().hurt); this.setVisible(true);
  }
  // troca a caixa de colisao mantendo o pe no lugar (o offset conta do topo da celula). ajustarCorpo ja sabe
  // qual celula usar (normal ou armadura), entao agachar so precisa trocar o estado e pedir o recalculo.
  agachar(v) {
    if (this.agachado === v) return;
    this.agachado = v;
    this.ajustarCorpo();
  }
  // so levanta se a caixa em pe couber: senao o heroi atravessaria o teto
  tetoLivre() {
    const camada = this.scene.camada;
    if (!camada) return true;
    const b = this.body, hb = this.h.hitbox, topo = b.bottom - hb.h + 1;
    for (const x of [b.left + 2, b.right - 2]) {
      for (let y = topo; y < b.top; y += 16) {
        const t = camada.getTileAtWorldXY(x, y);
        if (t && t.collides) return false;
      }
      const t = camada.getTileAtWorldXY(x, topo);
      if (t && t.collides) return false;
    }
    return true;
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
    // agachar: so no chao. Pular levanta primeiro, se houver teto. Soltar Baixo so levanta se couber.
    if (noChao && inp.baixo && !travado && !(inp.puloAgora && this.tetoLivre())) this.agachar(true);
    else if (this.agachado && (!noChao || !inp.baixo || inp.puloAgora) && this.tetoLivre()) this.agachar(false);
    // horizontal: aceleração e freio por herói; no chão o soco para o herói (Alex Kidd zera a velocidade no soco)
    let alvo = 0;
    const fv = this.fatorVel(t);
    if (!travado) { if (inp.esq) alvo = -h.vel * fv; else if (inp.dir) alvo = h.vel * fv; }
    if (this.agachado) alvo *= OBP.CFG.VEL_AGACHADO;   // desliza mais devagar que andando
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
    // de armadura, o toque do murro SEMPRE solta o poder (decisão 68), inclusive no meio da animação do soco
    // anterior. O soco físico continua preso à animação; só o tiro escapa dela.
    if (inp.socoAgora && !travado && this.armadura) { this.tiroAte = t + 133; this.emit('atirou'); }
    if (inp.socoAgora && this.socoMs < 0 && !travado) { this.socoMs = 0; this.acertados.clear(); this.emit('socou'); }
    else if (this.socoMs >= 0) {
      this.socoMs += dt;
      if (this.socoFrame() >= h.soco.frames) this.socoMs = -1;
    }
    this.animar(noChao, t);
  }
  animar(noChao, t) {
    const F = this.frames(), b = this.body;
    // invencível pisca por visibilidade (alpha parcial é proibido, spec 2.3): 4 f ligado, 4 f desligado
    this.setVisible(t >= this.invencivelAte || Math.floor(t / 66) % 2 === 0);
    if (t < (this.carimboAte || 0)) { if (Math.floor(t / 100) % 2) this.setTint(OBP.PAL.num(OBP.PAL.roxoBrilho)); else this.clearTint(); }
    else if (this.isTinted) this.clearTint();
    if (t < this.feridoAte) { this.anims.stop(); this.setFrame(this.agachado ? F.crouchHurt : F.hurt); return; }
    // tira de armadura não tem quadro de tiro agachado (só 8 quadros): o flash de disparo vale em pé ou agachado.
    if (this.armadura && t < this.tiroAte) { this.anims.stop(); this.setFrame(F.shoot); return; }
    if (this.agachado) {
      if (this.socoMs >= 0) { this.anims.stop(); this.setFrame(F.crouchPunch); return; }
      if (Math.abs(b.velocity.x) > 8) this.play(`${this.animPrefixo()}-deslizar`, true);
      else { this.anims.stop(); this.setFrame(F.crouch); }
      return;
    }
    if (this.socoMs >= 0) { this.anims.stop(); this.setFrame(F.punch); return; }
    // a tira de armadura não tem quadro de queda: o de pulo cobre subida e descida
    if (!noChao) { this.anims.stop(); this.setFrame(this.armadura ? F.jump : (b.velocity.y < 0 ? F.jump : F.fall)); return; }
    if (Math.abs(b.velocity.x) > 8) this.play(`${this.animPrefixo()}-andar`, true);
    else { this.anims.stop(); this.setFrame(F.idle); }
  }
};
