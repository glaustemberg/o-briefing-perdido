// Câmera (spec 9): dead zone 48x96, herói em 45% da largura (288 px de 640), look-ahead de 64 px após 8 f
// mantendo a nova direção, coordenada inteira.
OBP.Camera = class {
  constructor(scene, alvo, largMundo, altMundo) {
    this.cam = scene.cameras.main; this.alvo = alvo; this.dir = alvo.dir; this.frames = 0;
    this.cam.setBounds(0, 0, largMundo, altMundo);
    this.cam.setRoundPixels(true);
    this.cam.startFollow(alvo, true, 1, 1, -32 * this.dir, 0); // offset -32 põe o herói em 288 px olhando à direita
    this.cam.setDeadzone(48, 96);
  }
  update() {
    if (this.alvo.dir === this.dir) { this.frames = 0; return; }
    if (++this.frames >= 8) { this.dir = this.alvo.dir; this.frames = 0; this.cam.setFollowOffset(-32 * this.dir, 0); }
  }
};
