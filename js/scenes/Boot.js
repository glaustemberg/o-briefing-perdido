// Boot: carrega as tiras dos heróis, espera a fonte até 2 s e mostra "APERTE UMA TECLA" (destrava o WebAudio).
OBP.Boot = class extends Phaser.Scene {
  constructor() { super('Boot'); }
  preload() {
    this.add.text(320, 180, 'CARREGANDO', OBP.estiloTexto(16, OBP.PAL.cinzaClaro)).setOrigin(0.5);
    // Arquivo ausente (voz ainda não gravada) só avisa; o loader do Phaser segue e dispara 'complete' normalmente.
    this.load.on('loaderror', f => console.warn('asset ausente:', f.key, f.src));
    this.load.spritesheet('tikinho', 'assets/sprites/tikinho/tk-tira.png', { frameWidth: 64, frameHeight: 64 });
    this.load.spritesheet('gilpp', 'assets/sprites/gilpp/gp-tira.png', { frameWidth: 96, frameHeight: 96 });
  }
  create() {
    this.registry.set({ heroi: 'tikinho', coracoes: OBP.CFG.CORACOES, verba: 0, vidas: OBP.CFG.VIDAS });
    const fonte = document.fonts ? document.fonts.load('16px "Press Start 2P"').catch(() => []) : Promise.resolve([]);
    const teto = new Promise(r => setTimeout(r, 2000));
    Promise.race([fonte, teto]).then(() => this.mostrarAperte());
  }
  mostrarAperte() {
    this.children.removeAll();
    this.add.text(320, 150, 'tikinho & gilpp', OBP.estiloTexto(16, OBP.PAL.moeda)).setOrigin(0.5);
    this.add.text(320, 180, 'O BRIEFING PERDIDO', OBP.estiloTexto(16, OBP.PAL.branco)).setOrigin(0.5);
    this.add.text(320, 240, 'APERTE UMA TECLA', OBP.estiloTexto(8, OBP.PAL.cinzaClaro)).setOrigin(0.5);
    const ir = () => {
      const ctx = this.sound.context;
      if (ctx && ctx.state === 'suspended') ctx.resume();
      // Select entra na Task 5; até lá Boot vai direto para Level (Task 4).
      this.scene.start(OBP.Select ? 'Select' : (OBP.Level ? 'Level' : 'Boot'), { fase: 'fase-01' });
    };
    this.input.keyboard.once('keydown', ir);
    this.input.once('pointerdown', ir);
    if (this.input.gamepad) this.input.gamepad.once('down', ir);
  }
};
