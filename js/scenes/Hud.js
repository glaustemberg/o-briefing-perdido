// HUD (spec 2.11 e 7): corações 18x16 com vão 2 em (16,16); ícone de verba 16x16 em (224,16) e 5 dígitos com a
// borda direita em x = 304; slot do item 36x36 em (588,16) com a única moldura roxa do jogo. Roda em paralelo ao Level.
OBP.Hud = class extends Phaser.Scene {
  constructor() { super('Hud'); }
  static criarTexturas(scene) {
    const P = OBP.PAL;
    const coracao = (chave, cheio) => OBP.pixels(scene, chave, [
      '..#####...#####...',
      '.#oo####.#######..',
      '#o#############o#.',
      '#################.',
      '#################.',
      '#################.',
      '.###############..',
      '..#############...',
      '...###########....',
      '....#########.....',
      '.....#######......',
      '......#####.......',
      '.......###........',
      '........#.........',
      '..................',
      '..................',
    ], { '#': cheio ? P.coracao : P.pretoCamisa, 'o': cheio ? P.branco : P.rim });
    coracao('coracao-cheio', true); coracao('coracao-vazio', false);
    OBP.pixels(scene, 'saco', [
      '......####......',
      '.....#oooo#.....',
      '......#oo#......',
      '.....######.....',
      '....#oooooo#....',
      '...#oooooooo#...',
      '..#oooooooooo#..',
      '..#ooo#oo#ooo#..',
      '..#ooo####ooo#..',
      '..#oooo#ooooo#..',
      '..#ooo####ooo#..',
      '..#ooo#oo#ooo#..',
      '..#ooo####ooo#..',
      '...#oooooooo#...',
      '....########....',
      '................',
    ], { '#': P.laranja, 'o': P.moeda });
  }
  create() {
    OBP.Hud.criarTexturas(this);
    const P = OBP.PAL;
    this.coracoes = [];
    this.add.image(224, 16, 'saco').setOrigin(0, 0);
    this.txtVerba = this.add.text(304, 16, '00000', OBP.estiloTexto(16, P.moeda)).setOrigin(1, 0);
    const g = this.add.graphics();
    g.fillStyle(P.num(P.roxo)); g.fillRect(588, 16, 36, 36);
    g.fillStyle(P.num(P.roxoBrilho)); g.fillRect(590, 18, 32, 32);
    g.fillStyle(P.num(P.pretoCamisa)); g.fillRect(591, 19, 30, 30);
    this.desenharCoracoes(this.registry.get('coracoes'));
    this.mostrarVerba(this.registry.get('verba'));
    const aoCoracao = (_p, v) => this.desenharCoracoes(v), aoVerba = (_p, v) => this.mostrarVerba(v, true);
    this.registry.events.on('changedata-coracoes', aoCoracao);
    this.registry.events.on('changedata-verba', aoVerba);
    this.events.once('shutdown', () => { this.registry.events.off('changedata-coracoes', aoCoracao); this.registry.events.off('changedata-verba', aoVerba); });
  }
  desenharCoracoes(n) {
    this.coracoes.forEach(c => c.destroy());
    this.coracoes = [0, 1, 2].map(i => this.add.image(16 + i * 20, 16, i < n ? 'coracao-cheio' : 'coracao-vazio').setOrigin(0, 0));
  }
  // nudge de 2 px por 2 f (33 ms) a cada coleta (spec 4, saco de verba)
  mostrarVerba(v, nudge = false) {
    this.txtVerba.setText(String(Math.max(0, v)).padStart(5, '0'));
    if (nudge) { this.txtVerba.y = 18; this.time.delayedCall(33, () => { this.txtVerba.y = 16; }); }
  }
};
