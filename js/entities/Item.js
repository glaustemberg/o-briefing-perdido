// Itens (spec 4): saco de verba do mapa (parado) e solto por bloco (pula e cai na camada). Checkpoint e coxinha
// entram na Task 9. Um grupo só: sem gravidade por padrão, o saco solto liga a sua.
OBP.Itens = class {
  constructor(scene, camada) {
    this.scene = scene;
    this.grupo = scene.physics.add.group({ allowGravity: false });
    scene.physics.add.collider(this.grupo, camada);
  }
  criarDoMapa(entidades) {
    for (const e of entidades) {
      const x = e.col * 32 + 16, y = e.lin * 32 + 16;
      if (e.ch === '$') this.novo(x, y, 'saco', { tipo: 'saco', valor: 10 });
    }
  }
  novo(x, y, textura, dados) {
    const s = this.grupo.create(x, y, textura);
    Object.assign(s, dados);
    return s;
  }
  soltarSaco(x, y, valor) {
    const s = this.novo(x, y, 'saco', { tipo: 'saco', valor });
    s.body.setAllowGravity(true); s.body.setGravityY(900); s.body.setVelocity(0, -240);
    return s;
  }
  coletar(player, item) {
    if (item.tipo === 'saco') {
      item.destroy(); // some no mesmo frame
      this.scene.registry.inc('verba', item.valor);
      this.scene.events.emit('saco');
    }
  }
};
