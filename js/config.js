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
// Arquétipos de inimigo (spec 4 e adendo 7). Fica aqui, e não em Enemy.js, porque tests/teste.html carrega este
// arquivo sem o Phaser e Enemy.js não pode ser carregado (estende Phaser.Physics.Arcade.Sprite).
// fam: qual comportamento o update roda. grav: gravidade do corpo (0 = flutua). dy: deslocamento em px do ponto
// de nascimento em relação à marca do mapa (a nuvem "flutua no alto", mas o mapa a marca no chão, com os outros).
// fere: false só para a bomba antes de explodir. invencivel: soco e projétil não matam (hazard, não inimigo).
// frame* são chaves de TEXTURA carregadas pelo Boot (arte final ini-*/proj-*, uma imagem por estado, sem atlas).
OBP.INIMIGOS = {
  postit:  { fam: 'patrulha', frame: 'postit', vel: 80, grav: 1000 },
  abacaxi: { fam: 'patrulha', frame: 'ini-abacaxi-a', frames: ['ini-abacaxi-a', 'ini-abacaxi-b', 'ini-abacaxi-c'],
             vel: 200, grav: 1000, pula: 420, frameMorto: 'ini-abacaxi-morto' },
  nuvem:   { fam: 'nuvem', frame: 'ini-nuvem-a', frameDorme: 'ini-nuvem-dorme', frameAviso: 'ini-nuvem-raio',
             vel: 60, grav: 0, dy: -96 },
  loira:   { fam: 'loira', frame: 'ini-loira-idle', frameAlt: 'ini-loira-a', frameArremessa: 'ini-loira-arremessa',
             vel: 0, grav: 1000 },
  bomba:   { fam: 'bomba', frame: 'proj-bomba', framePousada: 'ini-bomba-solta',
             vel: 0, grav: 1000, invencivel: true, fere: false },
  raio:    { fam: 'raio', frame: 'proj-raio-solto', vel: 0, grav: 0, invencivel: true },
};
