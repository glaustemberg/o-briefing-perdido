// Inimigos genéricos (spec 4 e adendo 7). Uma classe só com a família de comportamento vindo de OBP.INIMIGOS,
// porque os cinco casos compartilham corpo 28x28, morte com knockback e giro, e só divergem no update.
// 32x32 com hitbox 28x28 (2 px menor por lado, spec 2.5); contato tira 1 coração; 1 soco ou projétil mata.
// Cada estado troca de TEXTURA inteira (o Boot carrega uma imagem por chave 'ini-*'/'proj-*', arte final sem
// atlas): não existe folha 'inimigos32' nesta versão, por isso não há OBP.frame() aqui, só setTexture.
OBP.Enemy = class extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, tipo) {
    const t = OBP.INIMIGOS[tipo];
    if (!t) throw new Error(`inimigo desconhecido: ${tipo}`);
    super(scene, x, y, t.frame);
    scene.add.existing(this); scene.physics.add.existing(this);
    this.tipo = tipo; this.t = t;
    this.body.setSize(28, 28).setOffset(2, 2);
    this.body.setAllowGravity(t.grav > 0);
    this.body.setGravityY(t.grav);
    this.dir = -1; this.morto = false; this.morreuEm = 0;
    this.invencivel = !!t.invencivel; this.fere = t.fere !== false;
    this.proximo = -1;  // relógio do próximo ato; -1 = ainda não iniciado (o primeiro update calibra)
    this.aviso = 0;     // fim do tell de 500 ms da nuvem
    this.pousou = -1; this.explodiu = -1; // relógios da bomba
  }
  update(t, dt) {
    const b = this.body;
    if (this.morto) {
      // reusa o giro e a expiração de OBP.Pedacos (Block.js) em vez de duplicar a mesma conta de ângulo
      if (OBP.Pedacos.passo(this, this.morreuEm, t)) this.destroy();
      return;
    }
    if (this.t.fam === 'patrulha') this.patrulhar(b, t);
    else if (this.t.fam === 'nuvem') this.comoNuvem(b, t);
    else if (this.t.fam === 'loira') this.comoLoira(b, t);
    else if (this.t.fam === 'bomba') this.comoBomba(b, t);
    else if (this.t.fam === 'raio' && (b.blocked.down || this.y > this.scene.map.heightInPixels)) this.destroy();
  }
  // post-it e abacaxi: andam, invertem na parede e na beirada; o abacaxi pula buraco pequeno em vez de virar.
  // quem tem `frames` (só o abacaxi) cicla os 3 quadros de corrida a cada 120 ms.
  patrulhar(b, t) {
    if (b.blocked.left) this.dir = 1; else if (b.blocked.right) this.dir = -1;
    if (b.blocked.down) {
      const tx = Math.floor((b.center.x + this.dir * 16) / 32), ty = Math.floor((b.bottom + 2) / 32);
      const abaixo = this.scene.camada.getTileAt(tx, ty);
      if (!abaixo || !abaixo.collides) {
        // buraco pequeno é o que tem chão a 2 tiles do outro lado; sem chão à vista, vira como o post-it
        const alem = this.scene.camada.getTileAt(tx + this.dir * 2, ty);
        if (this.t.pula && alem && alem.collides) b.setVelocityY(-this.t.pula);
        else this.dir *= -1;
      }
    }
    b.setVelocityX(this.dir * this.t.vel);
    this.setFlipX(this.dir > 0);
    if (this.t.frames) this.setTexture(this.t.frames[Math.floor(t / 120) % this.t.frames.length]);
  }
  // nuvem: flutua no alto, persegue o herói em x, para em cima dele, avisa 500 ms e solta o raio; 2 s de descanso
  comoNuvem(b, t) {
    if (this.aviso > 0) {
      this.setTexture(this.t.frameAviso); b.setVelocityX(0);
      if (t >= this.aviso) {
        this.aviso = 0; this.proximo = t + 2000;
        const r = new OBP.Enemy(this.scene, this.x, this.y + 24, 'raio');
        this.scene.inimigos.add(r);
        r.body.setVelocityY(300);
        OBP.Audio.raio();
      }
      return;
    }
    if (this.proximo > 0 && t < this.proximo) { this.setTexture(this.t.frameDorme); b.setVelocityX(0); return; }
    this.setTexture(this.t.frame);
    const dx = this.scene.player.x - this.x;
    if (Math.abs(dx) < 8) { b.setVelocityX(0); this.aviso = t + 500; } // 500 ms de tell, igual ao dos chefes (spec 6)
    else { this.dir = Math.sign(dx); b.setVelocityX(this.dir * this.t.vel); }
  }
  // menina loira: parada de costas, arremessa uma bomba em arco a cada 2,5 s. Na espera alterna idle/frameAlt
  // (blink lento) pra não ficar estática; frameArremessa é o quadro de recuo logo após o arremesso.
  comoLoira(b, t) {
    b.setVelocityX(0);
    if (this.proximo < 0) { this.proximo = t + 2500; return; }
    this.dir = Math.sign(this.scene.player.x - this.x) || 1;
    if (t < this.proximo) {
      if (t < this.proximo - 2300) this.setTexture(this.t.frameArremessa);
      else this.setTexture(Math.floor(t / 600) % 2 === 0 ? this.t.frame : this.t.frameAlt);
      return;
    }
    this.proximo = t + 2500;
    const bomba = new OBP.Enemy(this.scene, this.x + this.dir * 12, this.y - 12, 'bomba');
    this.scene.inimigos.add(bomba);
    bomba.body.setVelocity(this.dir * 140, -260); // arco curto: cai a pouco mais de 2 tiles à frente
  }
  // bomba: voa inofensiva (textura de projétil), pousa e troca pra textura solta, pavio de 1 s piscando,
  // explode e vira hazard 48x48 por 300 ms, some
  comoBomba(b, t) {
    if (this.pousou < 0) { if (b.blocked.down) { this.pousou = t; b.setVelocityX(0); this.setTexture(this.t.framePousada); } return; }
    if (t < this.pousou + 1000) { this.setVisible(Math.floor(t / 100) % 2 === 0); return; }
    if (this.explodiu < 0) {
      this.explodiu = t; this.fere = true;
      this.body.setSize(48, 48).setOffset(-8, -8); // hazard avulso maior que o sprite (adendo 7)
      OBP.Audio.explosao();
      OBP.Pedacos.spawn(this.scene, this.x, this.y, 'estrela32');
    }
    this.setVisible(Math.floor(t / 33) % 2 === 0);
    if (t > this.explodiu + 300) this.destroy();
  }
  morrer(dir, knockback) {
    this.morto = true; this.morreuEm = this.scene.time.now;
    if (this.t.frameMorto) this.setTexture(this.t.frameMorto);
    this.body.setAllowGravity(true); this.body.setGravityY(1000);
    // a nuvem já está no ar: knockback só horizontal, ela despenca (adendo 7)
    this.body.setVelocity(dir * knockback, this.t.fam === 'nuvem' ? 0 : -200);
  }
};
