// Constantes e utilidades sem Phaser no carregamento (o teste.html carrega este arquivo sem o Phaser).
window.OBP = window.OBP || {};
OBP.CFG = {
  LARG: 640, ALT: 360, TILE: 32,
  COYOTE_MS: 100, CORTE: 0.5, TERMINAL: 480, DECOLAGEM: 4, APICE_V: 48,
  CORACOES: 3, VIDAS: 3, VEL_AGACHADO: 0.45,   // desliza agachado a 45% da velocidade normal (decisao 53)
  INVENCIVEL_MS: 1000, RECUO_MS: 100, HITSTOP_DANO_MS: 100,
  PHASER_URL: 'https://cdnjs.cloudflare.com/ajax/libs/phaser/3.90.0/phaser.min.js',
};
// Zoom inteiro por pixel físico (spec 2.1): floor(min(larguraFísica/640, alturaFísica/360)), mínimo 1.
OBP.zoomFisico = (w = innerWidth, h = innerHeight, dpr = window.devicePixelRatio || 1) =>
  Math.max(1, Math.floor(Math.min(w * dpr / OBP.CFG.LARG, h * dpr / OBP.CFG.ALT)));
// O Phaser recebe o zoom em pixels CSS: z / dpr (1080p a 125% dá 3 físico e 2,4 CSS).
OBP.zoomInteiro = (w, h, dpr = window.devicePixelRatio || 1) => OBP.zoomFisico(w, h, dpr) / dpr;
// Fonte do HUD (spec 7): Press Start 2P pela Google Fonts; se não carregar, monospace de sistema.
OBP.estiloTexto = (tam = 16, cor = '#FAF6EE') => ({
  fontFamily: '"Press Start 2P", monospace', fontSize: `${tam}px`, color: cor, resolution: 1,
});
// Desenha um padrão de caracteres numa textura (1 caractere = 1 px). cores: { 'x': '#RRGGBB' }; '.' é transparente.
OBP.pixels = function (scene, chave, linhas, cores) {
  if (scene.textures.exists(chave)) return;
  const g = scene.make.graphics({ add: false });
  linhas.forEach((l, y) => [...l].forEach((c, x) => {
    if (cores[c]) { g.fillStyle(OBP.PAL.num(cores[c])); g.fillRect(x, y, 1, 1); }
  }));
  g.generateTexture(chave, linhas[0].length, linhas.length);
  g.destroy();
};
