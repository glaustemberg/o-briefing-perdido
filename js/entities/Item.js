// Itens (spec 4): lâmpada do mapa (parada) e solta por bloco (pula e cai na camada), checkpoint e coxinha
// de saida (Task 9). Um grupo so: sem gravidade por padrao, a lâmpada solta liga a sua.
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
      if (e.ch === '$') this.novo(x, y, 'item-lampada', { tipo: 'lampada', valor: 1 });
      else if (e.ch === 'K') this.novo(x, y, checkpointAtivo ? 'check-on' : 'check-off', { tipo: 'check' });
      else if (e.ch === 'X') this.novo(x, y, 'coxinha', { tipo: 'saida' });
      else if (e.ch === 'A') this.novo(x, y, 'item-carimbo', { tipo: 'carimbo' });   // carimbo APROVADO do mapa (revisao 8)
    }
  }
  novo(x, y, textura, dados) {
    const s = this.grupo.create(x, y, textura);
    // corpo de 20x20 só na lâmpada (32x32, do tamanho do tile): com o corpo padrão de 32x32 ela solta por um
    // bloco fica presa entre os tiles vizinhos. Checkpoint e coxinha também são 32x32 mas continuam com corpo cheio.
    if (dados.tipo === 'lampada') s.body.setSize(20, 20).setOffset(6, 6);
    Object.assign(s, dados);
    return s;
  }
  soltarLampada(x, y, valor) {
    const s = this.novo(x, y, 'item-lampada', { tipo: 'lampada', valor });
    s.body.setAllowGravity(true); s.body.setGravityY(900); s.body.setVelocity(0, -240);
    return s;
  }
  // Bola roxa com a marca da dot. (decisão 52): a única peça fora da grade de 32, 48x48 com corpo 40x40 centrado.
  // Origem no pé para a bola descansar no chão do tile em vez de flutuar meio tile acima dele.
  soltarBolaRoxa(x, y) {
    const s = this.grupo.create(x, y, 'item-bola-roxa');
    s.setOrigin(0.5, 1);
    s.body.setSize(40, 40).setOffset(4, 8);
    s.tipo = 'bola-roxa';
    s.body.setAllowGravity(true); s.body.setGravityY(900); s.body.setVelocity(0, -240);
    return s;
  }
  coletar(player, item) {
    const sc = this.scene;
    if (item.tipo === 'lampada') {
      item.destroy(); // some no mesmo frame
      sc.registry.inc('lampadas', item.valor);
      sc.events.emit('lampada');
    } else if (item.tipo === 'bola-roxa') {
      item.destroy();
      sc.registry.set('coracoesExtra', OBP.CFG.CORACOES_ARMADURA);
      sc.player.vestirArmadura(true);
      OBP.Audio.item(); OBP.Voice.falar('item-01');
    } else if (item.tipo === 'carimbo') {
      // vai para o inventario, para usar com N quando quiser; no teto de 3 o carimbo fica no chao
      const inv = sc.registry.get('inventario') || [];
      if (OBP.Inventario.quantos(inv, 'carimbo') >= OBP.Loja.MAX_POR_ITEM) return;
      sc.registry.set('inventario', inv.concat(['carimbo']));
      OBP.Audio.item(); OBP.Voice.reacaoCada('item-01', 100);
    } else if (item.tipo === 'check' && !sc.checkpointAtivo) {
      sc.ativarCheckpoint(item);
    } else if (item.tipo === 'saida') {
      sc.concluir();
    }
  }
};
