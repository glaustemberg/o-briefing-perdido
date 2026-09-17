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
// Layout do HUD (spec 2.11 mais adendo 1 e 2). Press Start 2P é monoespaçada com avanço de 1 em, então 5 dígitos
// de 16 px ocupam 80 px. Com ícone de 32x32 (o de 16x16 do M1 não existe mais na pasta de assets) o ícone não cabe
// mais dentro do bloco de dígitos: ele fica 4 px à esquerda do primeiro dígito. As bordas direitas exigidas pela
// spec (x = 304) e pelo adendo (x = 472) ficam intactas.
OBP.CFG.HUD = {
  Y: 16, ICONE: 32, DIG_LARG: 16, DIG_N: 5,
  CORACAO_X: 16, CORACAO_VAO: 20, CORACAO_MAX: 7,
  LAMPADA_ICONE_X: 188, LAMPADA_DIG_DIR: 304,
  RELOGIO_ICONE_X: 356, PRAZO_DIG_DIR: 472,
  SLOT_X: 588, SLOT_LADO: 36,
};
// Caixas horizontais do HUD, da esquerda para a direita. Existe para o teste provar que nada encosta em nada.
OBP.hudCaixas = function () {
  const H = OBP.CFG.HUD, dig = H.DIG_N * H.DIG_LARG;
  return [
    { nome: 'corações', x0: H.CORACAO_X, x1: H.CORACAO_X + H.CORACAO_MAX * H.CORACAO_VAO },
    { nome: 'ícone de lâmpada', x0: H.LAMPADA_ICONE_X, x1: H.LAMPADA_ICONE_X + H.ICONE },
    { nome: 'dígitos de lâmpada', x0: H.LAMPADA_DIG_DIR - dig, x1: H.LAMPADA_DIG_DIR },
    { nome: 'ícone de relógio', x0: H.RELOGIO_ICONE_X, x1: H.RELOGIO_ICONE_X + H.ICONE },
    { nome: 'dígitos de prazo', x0: H.PRAZO_DIG_DIR - dig, x1: H.PRAZO_DIG_DIR },
    { nome: 'slot de item', x0: H.SLOT_X, x1: H.SLOT_X + H.SLOT_LADO },
  ];
};
OBP.hudColide = function () {
  const c = OBP.hudCaixas();
  for (let i = 1; i < c.length; i++) if (c[i].x0 < c[i - 1].x1) return `${c[i].nome} encosta em ${c[i - 1].nome}`;
  if (c[0].x0 < 16) return 'corações passam da margem esquerda';
  if (c[c.length - 1].x1 > OBP.CFG.LARG - 16) return 'slot de item passa da margem direita';
  return null;
};
