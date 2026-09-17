// Cria o jogo. A lista de cenas filtra o que já existe para cada task rodar sozinha.
(function () {
  const game = new Phaser.Game({
    type: Phaser.AUTO, parent: 'jogo', width: OBP.CFG.LARG, height: OBP.CFG.ALT,
    pixelArt: true, roundPixels: true, backgroundColor: OBP.PAL.contorno,
    scale: { mode: Phaser.Scale.NONE, zoom: OBP.zoomInteiro(), autoCenter: Phaser.Scale.NO_CENTER },
    physics: { default: 'arcade', arcade: { gravity: { y: 0 }, tileBias: 32, fps: 60, debug: false } },
    input: { gamepad: true },
    scene: [OBP.Boot, OBP.Select, OBP.Shop, OBP.Level, OBP.Hud, OBP.Boss, OBP.Fim].filter(Boolean),
  });
  // O autoCenter do Phaser centraliza em pixel CSS, e com dpr fracionario (Windows a 125% ou 150%) isso cai em
  // MEIO pixel fisico. Com nearest neighbor, meio pixel de deslocamento come uma linha inteira do sprite: e o que
  // fazia a boca dos personagens sumir na capa (decisao 73). Aqui a margem e arredondada para pixel fisico.
  const alinhar = () => {
    const c = game.canvas, dpr = window.devicePixelRatio || 1, r = c.getBoundingClientRect();
    c.style.position = 'absolute'; c.style.margin = '0';
    c.style.left = Math.round((innerWidth - r.width) / 2 * dpr) / dpr + 'px';
    c.style.top = Math.round((innerHeight - r.height) / 2 * dpr) / dpr + 'px';
  };
  // Tela menor que a base de 640x360 (celular, decisao 74) nao tem zoom inteiro possivel: ali o jogo passa para
  // FIT, que escala por fator fracionario para caber. No desktop continua zoom inteiro com margem alinhada.
  // O zoom inteiro so vale enquanto ele nao encolhe o jogo: num celular deitado ele cai para 1x fisico e sobra
  // meia tela vazia. Abaixo de 1 o jogo passa a escalar para caber, ainda em Scale.NONE (trocar o scaleMode em
  // runtime nao e confiavel: o FIT passou a usar o tamanho do pai como tamanho do jogo e achatou a proporcao).
  const ajustar = () => {
    const inteiro = OBP.zoomInteiro();
    const cabe = Math.min(innerWidth / OBP.CFG.LARG, innerHeight / OBP.CFG.ALT);
    game.scale.setZoom(inteiro >= 1 ? inteiro : cabe);
    alinhar();
  };
  addEventListener('resize', ajustar);
  game.events.once('ready', ajustar);
  OBP.game = game;
  OBP.alinhar = alinhar;
})();
