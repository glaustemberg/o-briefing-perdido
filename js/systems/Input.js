// Um estado por frame unindo teclado (setas/WASD, Z ou espaço pula, X soca, Enter start), gamepad (spec 9) e,
// desde a decisão 74, os botões de toque do celular.
// Bordas (Agora/Soltou) são calculadas aqui para o teclado, o gamepad e o toque somarem sem duplicar.

// Controles de toque: seis botões desenhados DENTRO do canvas de 640x360, então escalam com o jogo e não
// precisam de HTML nenhum. O estado é global porque cada cena cria os seus e a leitura é sempre a mesma.
OBP.Toque = {
  estado: { esq: false, dir: false, cima: false, baixo: false, pulo: false, soco: false, item: false, usar: false },
  ativo: false,
  disponivel(scene) {
    const d = scene.sys.game.device.input;
    return !!(d.touch || navigator.maxTouchPoints > 0);
  },
  // zera tudo na troca de cena: um botão apertado no fim de uma fase ficaria preso na seguinte
  limpar() { for (const k in this.estado) this.estado[k] = false; },
  // quais: lista de botoes que ESTA cena usa (decisao 83). Antes toda cena desenhava os seis, e na loja quatro
  // deles nao faziam nada, tapando a lista de itens com dedo em cima.
  TODOS: ['esq', 'dir', 'cima', 'baixo', 'soco', 'pulo'],
  criar(scene, quais) {
    if (!this.disponivel(scene)) return;
    const usar = quais || this.TODOS;
    this.ativo = true;
    this.limpar();
    scene.input.addPointer(3);                 // sem isso o Phaser só enxerga um dedo por vez
    const P = OBP.PAL, D = 9000;
    const botao = (x, y, w, h, rotulo, chave, tam = 8) => {
      const z = scene.add.rectangle(x, y, w, h, P.num(P.branco), 0.16).setScrollFactor(0).setDepth(D)
        .setStrokeStyle(2, P.num(P.branco), 0.35).setInteractive({ useHandCursor: false });
      const t = scene.add.text(x, y, rotulo, OBP.estiloTexto(tam, P.branco)).setOrigin(0.5)
        .setScrollFactor(0).setDepth(D + 1).setAlpha(0.75);
      const liga = () => { this.estado[chave] = true; z.setFillStyle(P.num(P.moeda), 0.35); };
      const desliga = () => { this.estado[chave] = false; z.setFillStyle(P.num(P.branco), 0.16); };
      z.on('pointerdown', liga); z.on('pointerup', desliga);
      z.on('pointerout', desliga); z.on('pointerupoutside', desliga);
      scene.events.once('shutdown', () => { desliga(); z.destroy(); t.destroy(); });
      return z;
    };
    // colados nas bordas de baixo, para nao tapar o palco nem os nomes: cruz a esquerda, acao a direita
    const so = (chave, ...args) => { if (usar.includes(chave)) botao(...args); };
    so('esq', 28, 312, 48, 44, '<', 'esq', 16);
    so('dir', 84, 312, 48, 44, '>', 'dir', 16);
    so('cima', 56, 264, 48, 40, '^', 'cima', 16);
    so('baixo', 140, 312, 48, 44, 'v', 'baixo', 16);
    so('soco', 540, 288, 60, 56, 'SOCO', 'soco');
    so('pulo', 604, 320, 60, 56, 'PULO', 'pulo');
  },
};
OBP.Input = class {
  constructor(scene, botoesDeToque) {
    this.scene = scene;
    const k = scene.input.keyboard;
    this.k = {
      esq: [k.addKey('LEFT'), k.addKey('A')], dir: [k.addKey('RIGHT'), k.addKey('D')],
      cima: [k.addKey('UP'), k.addKey('W')], baixo: [k.addKey('DOWN'), k.addKey('S')],
      // Berg (17/09): pulo no espaco e murro no M. Z e X ficam como alternativa para quem ja pegou o jeito.
      pulo: [k.addKey('SPACE'), k.addKey('Z')], soco: [k.addKey('M'), k.addKey('X')], start: [k.addKey('ENTER')],
      item: [k.addKey('B')], usar: [k.addKey('N')],   // Berg (23/09): B troca o item do inventario, N usa
    };
    this.ant = { esq: false, dir: false, pulo: false, soco: false, start: false, item: false, usar: false };
    this.estado = Object.assign({}, OBP.Input.VAZIO);
    OBP.Toque.criar(scene, botoesDeToque);
  }
  ler() {
    const down = ks => ks.some(x => x.isDown);
    const gp = this.scene.input.gamepad;
    const pad = gp && gp.total > 0 ? gp.getPad(0) : null;
    const ex = pad ? pad.leftStick.x : 0, ey = pad ? pad.leftStick.y : 0;
    const e = this.estado;
    e.gamepad = !!pad;
    const tq = OBP.Toque.estado;
    const esq = down(this.k.esq) || !!(pad && (pad.left || ex < -0.5)) || tq.esq;
    const dir = down(this.k.dir) || !!(pad && (pad.right || ex > 0.5)) || tq.dir;
    e.cima = down(this.k.cima) || !!(pad && (pad.up || ey < -0.5)) || tq.cima;
    e.baixo = down(this.k.baixo) || !!(pad && (pad.down || ey > 0.5)) || tq.baixo;
    const pulo = down(this.k.pulo) || !!(pad && pad.A) || tq.pulo;
    const soco = down(this.k.soco) || !!(pad && (pad.X || pad.B)) || tq.soco;
    // no celular nao existe Enter: o botao de pulo ja confirma em todo menu, entao start fica so no teclado/pad
    const start = down(this.k.start) || !!(pad && pad.buttons[9] && pad.buttons[9].pressed);
    const item = down(this.k.item) || !!(pad && pad.L1) || !!tq.item, usar = down(this.k.usar) || !!(pad && pad.R1) || !!tq.usar;
    e.itemAgora = item && !this.ant.item; e.usarAgora = usar && !this.ant.usar;
    e.esq = esq; e.dir = dir; e.esqAgora = esq && !this.ant.esq; e.dirAgora = dir && !this.ant.dir;
    e.puloAgora = pulo && !this.ant.pulo; e.puloSegurado = pulo; e.puloSoltou = !pulo && this.ant.pulo;
    e.socoAgora = soco && !this.ant.soco; e.socoSegurado = soco; e.startAgora = start && !this.ant.start;
    this.ant = { esq, dir, pulo, soco, start, item, usar };
    return e;
  }
};
OBP.Input.VAZIO = Object.freeze({
  esq: false, dir: false, cima: false, baixo: false, esqAgora: false, dirAgora: false,
  puloAgora: false, puloSegurado: false, puloSoltou: false, socoAgora: false, socoSegurado: false, startAgora: false, itemAgora: false, usarAgora: false, gamepad: false,
});
