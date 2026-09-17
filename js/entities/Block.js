// Blocos são tiles (spec 4 e 9). Estrela quebra com soco e vira 4 quadrantes 16x16 do próprio tile; pergunta abre
// por cabeçada ou soco e vira o tile usado (solta lâmpadas); reforçado só o gilpp quebra, em coluna de até 3.

// OBP.Pedacos: "sprite explode em 4 quadrantes que giram em passos de 90 graus e somem em 700 ms" (spec 4), num só
// lugar porque a Task 8 reusa isto para a morte do inimigo em vez de duplicar a mesma conta de ângulo e expiração.
// A textura passada já precisa ter os frames 'q0'..'q3' (16x16 cada) registrados por quem a criou.
OBP.Pedacos = {
  grupo(scene) {
    // scene é reusada entre Level -> Select -> Level; o grupo antigo morre no shutdown da física mas a
    // referência guardada aqui sobrevive, então também checa se o grupo ainda tem .scene (fica vazio quando destruído).
    if (!scene._pedacosGrupo || !scene._pedacosGrupo.scene) scene._pedacosGrupo = scene.physics.add.group();
    return scene._pedacosGrupo;
  },
  // 4 quadrantes a ±120 px/s horizontal e -280 vertical, gravidade 1000 (spec 4)
  spawn(scene, x, y, textura) {
    const g = this.grupo(scene), t = scene.time.now;
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sy], i) => {
      const p = g.create(x + sx * 8, y + sy * 8, textura, `q${i}`);
      p.body.setAllowGravity(true); p.body.setGravityY(1000); p.body.setVelocity(sx * 120, -280); p.nasceu = t;
    });
  },
  // giro em passos de 90 graus a cada 60 ms (a spec pede 45, a regra 2.3 proíbe rotação fora de 90); somem em 700 ms.
  // Um objeto só (não só os 4 quadrantes): a morte do inimigo (Task 8) chama isto direto no próprio sprite em vez de
  // duplicar a conta de ângulo e expiração. Devolve true quando o objeto já passou dos 700 ms (quem chama destrói).
  passo(obj, nascimento, t) {
    obj.angle = Math.floor((t - nascimento) / 60) * 90;
    return t - nascimento > 700;
  },
  update(scene, t) {
    if (!scene._pedacosGrupo || !scene._pedacosGrupo.scene) return;
    for (const p of [...scene._pedacosGrupo.getChildren()]) {
      if (this.passo(p, p.nasceu, t)) p.destroy();
    }
  },
};

OBP.Blocos = class {
  static criarTexturas(scene) {
    if (scene.textures.exists('estrela32')) return;
    const P = OBP.PAL, g = scene.make.graphics({ add: false });
    const r = (x, y, w, h, cor) => { g.fillStyle(P.num(cor)); g.fillRect(x, y, w, h); };
    r(0, 0, 32, 32, P.laranja); r(2, 2, 28, 28, P.moeda); r(14, 8, 4, 16, P.branco); r(8, 14, 16, 4, P.branco);
    g.generateTexture('estrela32', 32, 32); g.destroy();
    const tex = scene.textures.get('estrela32');
    tex.add('q0', 0, 0, 0, 16, 16); tex.add('q1', 0, 16, 0, 16, 16); tex.add('q2', 0, 0, 16, 16, 16); tex.add('q3', 0, 16, 16, 16, 16);
  }
  constructor(scene, camada) {
    this.scene = scene; this.camada = camada;
    this.perguntasAbertas = 0; // ordem fixa por fase, como no DX (spec 4): o 1º ? da fase é a bola roxa
  }
  // callback do collider herói x camada: cabeçada em '?' (blocked.up) abre o bloco
  cabecada(player, tile) {
    if (tile.index === 3 && player.body.blocked.up) this.abrirPergunta(tile);
  }
  // soco: cada tile é atingido uma vez por soco (player.acertados zera no evento 'socou')
  socar(caixa, player) {
    const tiles = this.camada.getTilesWithinWorldXY(caixa.x, caixa.y, caixa.w, caixa.h, { isNotEmpty: true });
    for (const t of tiles) {
      const chave = `${t.x},${t.y}`;
      if (player.acertados.has(chave)) continue;
      if (t.index === 2) { player.acertados.add(chave); this.quebrar(t, true); }
      else if (t.index === 3) { player.acertados.add(chave); this.abrirPergunta(t); }
      else if (t.index === 4 && player.h.quebraReforcado) { player.acertados.add(chave); this.quebrarColuna(t); }
    }
  }
  quebrar(tile, soltaLampada) {
    const cx = tile.getCenterX(), cy = tile.getCenterY(), t = this.scene.time.now;
    this.camada.removeTileAt(tile.x, tile.y);
    OBP.Pedacos.spawn(this.scene, cx, cy, 'estrela32');
    if (soltaLampada) {
      // 10 ou 20: posição e instante decidem (única aleatoriedade fora do jokenpô)
      const valor = ((tile.x + tile.y + Math.floor(t / 100)) % 2) ? 20 : 10;
      this.scene.itens.soltarLampada(cx, cy - 16, valor);
    }
    this.scene.events.emit('bloco-quebrado');
  }
  abrirPergunta(tile) {
    this.camada.putTileAt(OBP.Mapa.USADO, tile.x, tile.y);
    const x = tile.getCenterX(), y = tile.getTop() - 8;
    if (this.perguntasAbertas++ === 0) this.scene.itens.soltarBolaRoxa(x, y);
    else this.scene.itens.soltarLampada(x, y, 2);
    this.scene.events.emit('bloco-quebrado');
  }
  // coluna contígua de R a partir do tile socado, até 3 (spec 4)
  quebrarColuna(tile) {
    const col = [tile];
    for (const dy of [-1, 1]) {
      let y = tile.y + dy;
      while (col.length < 3) { const t = this.camada.getTileAt(tile.x, y); if (!t || t.index !== 4) break; col.push(t); y += dy; }
    }
    col.forEach(t => this.quebrar(t, false));
  }
  update(t) { OBP.Pedacos.update(this.scene, t); }
};
