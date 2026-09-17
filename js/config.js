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
// Prazo alvo por fase em segundos (adendo 2). Escopo de hoje: só as 4 fases que restaram no jogo (1 Estúdio,
// 2 Reunião, 5 Gráfica, 8 Torre, dividida em 08a/08b). As demais entram nesta mesma tabela quando entrarem no
// jogo, sem mexer em lógica nenhuma: Relogio e Level só leem por OBP.PRAZOS[faseId].
OBP.PRAZOS = {
  'fase-01': 180, 'fase-02': 220, 'fase-05': 220, 'fase-08a': 130, 'fase-08b': 170,
};
// Relógio do prazo. Zerou, não trava: o contador vira progressivo e a cor muda (o Hud decide a cor por atrasado()).
OBP.Relogio = {
  formatar(seg) {
    const s = Math.min(5999, Math.floor(Math.abs(seg)));
    return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  },
  atrasado(seg) { return seg < 0; },
  // bônus de tempo (decisão do Berg 2026-09-17): 1 lâmpada a cada 4 s restantes, arredondado para baixo, teto 40/fase
  bonus(seg) { return Math.min(40, Math.max(0, Math.floor(seg / 4))); },
};
// Caixas do HUD (spec 7 + adendo 2): fonte única de verdade pro desenho (Hud.js) e pro teste anti-colisão.
// Armadilha diagnosticada: a Press Start 2P avança 1 em por caractere, então um ícone de 32x32 na mesma borda
// esquerda dos dígitos fica embaixo deles. x,y,w,h em px de jogo (640x360).
OBP.HUD = {
  coracoes: { x: 16, y: 16, w: 2 * 20 + 18, h: 16 },
  lampadaIcone: { x: 188, y: 16, w: 32, h: 32 },
  lampadaDigitos: { x: 224, y: 16, w: 80, h: 16 },   // 5 dígitos de 16 px, borda direita em 304
  prazoIcone: { x: 356, y: 16, w: 32, h: 32 },
  prazoDigitos: { x: 392, y: 16, w: 80, h: 16 },     // "00:00", borda direita em 472
  item: { x: 588, y: 16, w: 36, h: 36 },
};
// Colisão AABB entre as caixas do HUD: devolve o par que se sobrepõe, ou null se está tudo limpo.
OBP.hudColide = () => {
  const nomes = Object.keys(OBP.HUD);
  for (let i = 0; i < nomes.length; i++) for (let j = i + 1; j < nomes.length; j++) {
    const a = OBP.HUD[nomes[i]], b = OBP.HUD[nomes[j]];
    if (a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h) return [nomes[i], nomes[j]];
  }
  return null;
};
