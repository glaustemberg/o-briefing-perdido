// Cria o jogo. A lista de cenas filtra o que já existe para cada task rodar sozinha.
(function () {
  const game = new Phaser.Game({
    type: Phaser.AUTO, parent: 'jogo', width: OBP.CFG.LARG, height: OBP.CFG.ALT,
    pixelArt: true, roundPixels: true, backgroundColor: OBP.PAL.contorno,
    scale: { mode: Phaser.Scale.NONE, zoom: OBP.zoomInteiro(), autoCenter: Phaser.Scale.CENTER_BOTH },
    physics: { default: 'arcade', arcade: { gravity: { y: 0 }, tileBias: 32, fps: 60, debug: false } },
    input: { gamepad: true },
    scene: [OBP.Boot, OBP.Select, OBP.Shop, OBP.Level, OBP.Hud].filter(Boolean),
  });
  addEventListener('resize', () => game.scale.setZoom(OBP.zoomInteiro()));
  OBP.game = game;
})();
