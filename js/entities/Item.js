// Itens (spec 4): saco de verba do mapa (parado) e solto por bloco (pula e cai na camada), checkpoint e coxinha
// de saida (Task 9). Um grupo so: sem gravidade por padrao, o saco solto liga a sua.
OBP.Itens = class {
  constructor(scene, camada) {
    this.scene = scene;
    this.grupo = scene.physics.add.group({ allowGravity: false });
    scene.physics.add.collider(this.grupo, camada);
  }
  static criarTexturas(scene) {
    const P = OBP.PAL;
    const bandeira = (chave, pano) => OBP.pixels(scene, chave, [
      '....##..........................',
      '....##oooooooooooo..............',
      '....##oooooooooooooo............',
      '....##oooooooooooooooo..........',
      '....##oooooooooooooooooo........',
      '....##oooooooooooooooooooo......',
      '....##oooooooooooooooooo........',
      '....##oooooooooooooooo..........',
      '....##oooooooooooooo............',
      '....##oooooooooooo..............',
      '....##..........................',
      '....##..........................',
      '....##..........................',
      '....##..........................',
      '....##..........................',
      '....##..........................',
      '....##..........................',
      '....##..........................',
      '....##..........................',
      '....##..........................',
      '....##..........................',
      '....##..........................',
      '....##..........................',
      '....##..........................',
      '....##..........................',
      '....##..........................',
      '....##..........................',
      '....##..........................',
      '....##..........................',
      '..######........................',
      '..######........................',
      '................................',
    ], { '#': P.rim, 'o': pano });
    bandeira('check-off', P.cinzaClaro); bandeira('check-on', P.verdeClaro);
    OBP.pixels(scene, 'coxinha', [
      '................................',
      '................................',
      '..............##................',
      '.............#oo#...............',
      '............#oooo#..............',
      '...........#oooooo#.............',
      '..........#oooooooo#............',
      '.........#oooooooooo#...........',
      '........#oooooooooooo#..........',
      '.......#oooooooooooooo#.........',
      '......#oooooooooooooooo#........',
      '.....#oooooooooooooooooo#.......',
      '....#oooooo###ooooooooooo#......',
      '....#ooooo#aaa#oooooooooo#......',
      '...#oooooo#aaa#ooooooooooo#.....',
      '...#ooooooo###oooooooooooo#.....',
      '...#oooooooooooooooooooooo#.....',
      '...#oooooooooooooooooooooo#.....',
      '...#oooooooooooooooooooooo#.....',
      '...#oooooooooooooooooooooo#.....',
      '....#oooooooooooooooooooo#......',
      '....#oooooooooooooooooooo#......',
      '.....#oooooooooooooooooo#.......',
      '......#oooooooooooooooo#........',
      '.......##oooooooooooo##.........',
      '.........####oooo####...........',
      '.............####...............',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
    ], { '#': P.terraEscura, 'o': P.laranja, 'a': P.amareloClaro });
  }
  // ch: entidades do mapa vindas de OBP.Mapa.parse. checkpointAtivo: a bandeira ja nasce verde apos um reinicio.
  criarDoMapa(entidades, checkpointAtivo) {
    OBP.Itens.criarTexturas(this.scene);
    for (const e of entidades) {
      const x = e.col * 32 + 16, y = e.lin * 32 + 16;
      if (e.ch === '$') this.novo(x, y, 'saco', { tipo: 'saco', valor: 10 });
      else if (e.ch === 'K') this.novo(x, y, checkpointAtivo ? 'check-on' : 'check-off', { tipo: 'check' });
      else if (e.ch === 'X') this.novo(x, y, 'coxinha', { tipo: 'saida' });
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
    const sc = this.scene;
    if (item.tipo === 'saco') {
      item.destroy(); // some no mesmo frame
      sc.registry.inc('verba', item.valor);
      sc.events.emit('saco');
    } else if (item.tipo === 'check' && !sc.checkpointAtivo) {
      sc.ativarCheckpoint(item);
    } else if (item.tipo === 'saida') {
      sc.concluir();
    }
  }
};
