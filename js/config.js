// Constantes e utilidades sem Phaser no carregamento (o teste.html carrega este arquivo sem o Phaser).
window.OBP = window.OBP || {};
OBP.CFG = {
  LARG: 640, ALT: 360, TILE: 32,
  COYOTE_MS: 100, CORTE: 0.5, TERMINAL: 480, DECOLAGEM: 4, APICE_V: 48,
  CORACOES: 3, VIDAS: 3, VEL_AGACHADO: 0.45, FASE_FINAL: 'fase-08b',   // desliza agachado a 45% da velocidade normal (decisao 53)
  INVENCIVEL_MS: 1000, RECUO_MS: 100, HITSTOP_DANO_MS: 100,
  PROJETEIS_NA_TELA: 3,
  // sobe quando um audio e refeito com o MESMO nome: sem isso o navegador serve o arquivo velho do cache
  VERSAO_AUDIO: 5,   // era 1: com teto de 1 o toque do murro de armadura 'nao saia' enquanto o tiro anterior voava
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
OBP.Relogio = {
  formatar(seg) {
    const s = Math.min(5999, Math.floor(Math.abs(seg)));
    return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  },
  atrasado(seg) { return seg < 0; },
  // bônus de tempo (decisão do Berg 2026-09-17): 1 lâmpada a cada 4 s restantes, arredondado para baixo, teto 40/fase
  bonus(seg) { return Math.min(40, Math.max(0, Math.floor(seg / 4))); },
};
OBP.PRAZOS = {
  'fase-01': 140, 'fase-02': 170, 'fase-05': 170, 'fase-08a': 100, 'fase-08b': 130,
};
// Ordem das fases do escopo cortado (decisão 63): Estúdio, Reunião, Gráfica e as duas metades da Torre. Terminar
// uma leva à seguinte pela loja; a última cai na Seleção, que é onde uma partida nova começa.
OBP.ORDEM = ['fase-01', 'fase-02', 'fase-05', 'fase-08a', 'fase-08b'];
OBP.proximaFase = (id) => OBP.ORDEM[OBP.ORDEM.indexOf(id) + 1] || null;
// Arquétipos de inimigo (spec 4 e adendo 7). Fica aqui, e não em Enemy.js, porque tests/teste.html carrega este
// arquivo sem o Phaser e Enemy.js não pode ser carregado (estende Phaser.Physics.Arcade.Sprite).
// fam: qual comportamento o update roda. grav: gravidade do corpo (0 = flutua). dy: deslocamento em px do ponto
// de nascimento em relação à marca do mapa (a nuvem "flutua no alto", mas o mapa a marca no chão, com os outros).
// fere: false só para a bomba antes de explodir. invencivel: soco e projétil não matam (hazard, não inimigo).
// frame* são chaves de TEXTURA carregadas pelo Boot (arte final ini-*/proj-*, uma imagem por estado, sem atlas).
// corpo: [largura, altura] da hitbox quando o sprite nao e 32x32 (decisao 68). Sem corpo, vale 28x28 da spec 2.5.
OBP.INIMIGOS = {
  abacaxi: { fam: 'patrulha', frame: 'ini-abacaxi-a', frames: ['ini-abacaxi-a', 'ini-abacaxi-b', 'ini-abacaxi-c'],
             vel: 230, grav: 1000, pula: 420, pulaCada: 900, frameMorto: 'ini-abacaxi-morto', corpo: [32, 40] },
  nuvem:   { fam: 'nuvem', frame: 'ini-nuvem-a', frameDorme: 'ini-nuvem-dorme', frameAviso: 'ini-nuvem-raio',
             vel: 90, grav: 0, dy: -96 },
  loira:   { fam: 'loira', frame: 'ini-loira-idle', frameAlt: 'ini-loira-a', frameArremessa: 'ini-loira-arremessa',
             vel: 0, grav: 1000, corpo: [26, 56] },
  // a bomba quica 3 vezes e explode; encostar nela em qualquer instante explode na hora e mata (decisao 68)
  bomba:   { fam: 'bomba', frame: 'proj-bomba', framePousada: 'ini-bomba-solta',
             vel: 0, grav: 1000, invencivel: true, quique: 0.55, quiquesAteExplodir: 3 },
  raio:    { fam: 'raio', frame: 'proj-raio-solto', vel: 0, grav: 0, invencivel: true },
};
// Armadura roxa (adendo 6): +3 corações num contador separado, drenado antes do contador normal. Ao zerar, o herói
// volta à forma normal sem perder coração normal nenhum. Fica puro aqui para o teste cobrir a ordem da drenagem.
OBP.CFG.CORACOES_ARMADURA = 3;
OBP.Armadura = {
  vestida(extra) { return extra > 0; },
  dano(coracoes, extra) {
    return extra > 0 ? { coracoes, extra: extra - 1 } : { coracoes: coracoes - 1, extra: 0 };
  },
};

// Jokenpo dos chefes (spec 6). Triade: Briefing vence Prazo, Prazo vence Verba, Verba vence Briefing.
// Puro de proposito: o teste cobre a triade e a sequencia fixa sem precisar do Phaser.
OBP.JOKENPO = {
  MAOS: ['briefing', 'prazo', 'verba'],
  // cada mao vence a seguinte na lista; empate devolve 0, vitoria do jogador 1, derrota -1
  duelo(meu, dele) {
    if (meu === dele) return 0;
    const i = this.MAOS.indexOf(meu), j = this.MAOS.indexOf(dele);
    if (i < 0 || j < 0) throw new Error('mao invalida: ' + meu + ' x ' + dele);
    return (i + 1) % 3 === j ? 1 : -1;
  },
  // sequencia FIXA por chefe (spec 6): o jogador perde, aprende e ganha na revanche.
  // O Sobrinho pede verba, depois briefing, depois prazo. Melhor de 3: quem faz 2 pontos leva.
  SEQUENCIA: { sobrinho: ['verba', 'briefing', 'prazo'] },
  maoDoChefe(chefe, rodada) {
    const seq = this.SEQUENCIA[chefe] || this.SEQUENCIA.sobrinho;
    return seq[rodada % seq.length];
  },
  // devolve 'jogador', 'chefe' ou null enquanto ninguem fez 2 pontos
  vencedor(pontos) {
    if (pontos.jogador >= 2) return 'jogador';
    if (pontos.chefe >= 2) return 'chefe';
    return null;
  },
};
