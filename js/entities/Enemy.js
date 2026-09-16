// Inimigo genérico do M1: Post-it (spec 4, arquétipo c reduzido a patrulha). 32x32, hitbox 28x28, anda a 80 px/s,
// inverte na parede e na beirada, 1 soco mata e ele voa no knockback girando, some em 700 ms.
OBP.Enemy = class extends Phaser.Physics.Arcade.Sprite {
  static criarTextura(scene) {
    if (scene.textures.exists('postit')) return;
    const P = OBP.PAL, g = scene.make.graphics({ add: false });
    const r = (x, y, w, h, cor) => { g.fillStyle(P.num(cor)); g.fillRect(x, y, w, h); };
    r(1, 1, 30, 30, P.moeda); r(1, 1, 30, 4, P.amareloClaro);      // papel e faixa de cola
    r(25, 25, 6, 6, P.laranja); r(27, 27, 4, 4, P.areia);           // dobra do canto
    r(9, 13, 3, 3, P.contorno); r(20, 13, 3, 3, P.contorno);        // olhos
    r(12, 21, 8, 2, P.contorno);                                    // boca
    g.generateTexture('postit', 32, 32); g.destroy();
  }
  constructor(scene, x, y) {
    super(scene, x, y, 'postit');
    scene.add.existing(this); scene.physics.add.existing(this);
    this.body.setSize(28, 28).setOffset(2, 2); // 2 px menor por lado (spec 4)
    this.body.setGravityY(1000);
    this.dir = -1; this.vel = 80; this.morto = false; this.morreuEm = 0;
  }
  update(t, dt) {
    const b = this.body;
    if (this.morto) {
      // reusa o giro e a expiração de OBP.Pedacos (Block.js) em vez de duplicar a mesma conta de ângulo
      if (OBP.Pedacos.passo(this, this.morreuEm, t)) this.destroy();
      return;
    }
    if (b.blocked.left) this.dir = 1; else if (b.blocked.right) this.dir = -1;
    if (b.blocked.down) { // beirada: sem tile sólido logo abaixo do pé da frente, vira
      const tx = Math.floor((b.center.x + this.dir * 16) / 32), ty = Math.floor((b.bottom + 2) / 32);
      const abaixo = this.scene.camada.getTileAt(tx, ty);
      if (!abaixo || !abaixo.collides) this.dir *= -1;
    }
    b.setVelocityX(this.dir * this.vel);
    this.setFlipX(this.dir > 0);
  }
  morrer(dir, knockback) {
    this.morto = true; this.morreuEm = this.scene.time.now;
    this.body.setVelocity(dir * knockback, -200);
  }
};
