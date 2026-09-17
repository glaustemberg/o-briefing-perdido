// Projéteis da forma de armadura (adendo 6). 32x32 vindos de assets/tiles/itens (uma imagem por chave 'proj-*',
// carregada pelo Boot sem atlas, igual ao Enemy.js), hitbox 24x24, 260 px/s, sem gravidade, somem ao bater em
// tile, em inimigo ou ao sair da tela. Um por vez para os dois heróis: com o disparo preso a "segurar o soco",
// rajada sairia de graça e o soco físico perderia a razão de existir.
OBP.Projeteis = class {
  constructor(scene, camada) {
    this.scene = scene; this.n = 0;
    this.grupo = scene.physics.add.group({ allowGravity: false });
    scene.physics.add.collider(this.grupo, camada, p => p.destroy());
  }
  lancar(player) {
    if (this.grupo.countActive(true) > 0) return null;
    const h = player.h, b = player.body, lado = h.projetil.hitbox;
    const nome = OBP.ProjLogic.textura(h, this.n++);
    const x = player.dir > 0 ? b.right + 16 : b.left - 16;
    const s = this.grupo.create(x, b.top + 16, nome);
    s.body.setSize(lado, lado).setOffset((32 - lado) / 2, (32 - lado) / 2);
    s.body.setVelocityX(player.dir * h.projetil.vel);
    s.setFlipX(player.dir < 0);
    return s;
  }
  update() {
    const cam = this.scene.cameras.main;
    for (const p of [...this.grupo.getChildren()]) {
      if (p.x < cam.scrollX - 64 || p.x > cam.scrollX + OBP.CFG.LARG + 64) p.destroy();
    }
  }
};
