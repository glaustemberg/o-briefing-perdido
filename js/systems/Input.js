// Um estado por frame unindo teclado (setas/WASD, Z ou espaço pula, X soca, Enter start) e gamepad (spec 9).
// Bordas (Agora/Soltou) são calculadas aqui para o teclado e o gamepad somarem sem duplicar.
OBP.Input = class {
  constructor(scene) {
    this.scene = scene;
    const k = scene.input.keyboard;
    this.k = {
      esq: [k.addKey('LEFT'), k.addKey('A')], dir: [k.addKey('RIGHT'), k.addKey('D')],
      cima: [k.addKey('UP'), k.addKey('W')], baixo: [k.addKey('DOWN'), k.addKey('S')],
      pulo: [k.addKey('Z'), k.addKey('SPACE')], soco: [k.addKey('X')], start: [k.addKey('ENTER')],
    };
    this.ant = { esq: false, dir: false, pulo: false, soco: false, start: false };
    this.estado = Object.assign({}, OBP.Input.VAZIO);
  }
  ler() {
    const down = ks => ks.some(x => x.isDown);
    const gp = this.scene.input.gamepad;
    const pad = gp && gp.total > 0 ? gp.getPad(0) : null;
    const ex = pad ? pad.leftStick.x : 0, ey = pad ? pad.leftStick.y : 0;
    const e = this.estado;
    e.gamepad = !!pad;
    const esq = down(this.k.esq) || !!(pad && (pad.left || ex < -0.5));
    const dir = down(this.k.dir) || !!(pad && (pad.right || ex > 0.5));
    e.cima = down(this.k.cima) || !!(pad && (pad.up || ey < -0.5));
    e.baixo = down(this.k.baixo) || !!(pad && (pad.down || ey > 0.5));
    const pulo = down(this.k.pulo) || !!(pad && pad.A);
    const soco = down(this.k.soco) || !!(pad && (pad.X || pad.B));
    const start = down(this.k.start) || !!(pad && pad.buttons[9] && pad.buttons[9].pressed);
    e.esq = esq; e.dir = dir; e.esqAgora = esq && !this.ant.esq; e.dirAgora = dir && !this.ant.dir;
    e.puloAgora = pulo && !this.ant.pulo; e.puloSegurado = pulo; e.puloSoltou = !pulo && this.ant.pulo;
    e.socoAgora = soco && !this.ant.soco; e.startAgora = start && !this.ant.start;
    this.ant = { esq, dir, pulo, soco, start };
    return e;
  }
};
OBP.Input.VAZIO = Object.freeze({
  esq: false, dir: false, cima: false, baixo: false, esqAgora: false, dirAgora: false,
  puloAgora: false, puloSegurado: false, puloSoltou: false, socoAgora: false, startAgora: false, gamepad: false,
});
