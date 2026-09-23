// Parâmetros da seção 3 da spec, prefixo e vozes de cada herói (spec 8), e as funções puras de física
// que Player.js e tests/teste.html compartilham.
window.OBP = window.OBP || {};
OBP.FRAMES = { idle: 0, walk1: 1, walk2: 2, walk3: 3, jump: 4, fall: 5, punch: 6, hurt: 7,
  // 8 a 15: ciclo de andar (decisao 42). 16 a 22: agachar e extras (decisao 53)
  crouch: 16, crouchPunch: 17, crouchStep: 18, crouchHurt: 19, windup: 20, lookUp: 21, idle2: 22 };
// A tira de armadura tem 8 quadros (a normal tem 16): não há quadro de queda, o de pulo serve para subida e queda,
// e o ciclo de andar tem só walkA e walkC, por isso roda mais devagar que o de 8 quadros da forma normal.
// Os quadros de agachar (8 a 11) existem porque a armadura também agacha (ruling do Berg): mesma pose, tira menor.
OBP.FRAMES_ARMADURA = { idle: 0, walkA: 1, walkC: 2, jump: 3, punch: 4, shoot: 5, hurt: 6, win: 7,
  crouch: 8, crouchPunch: 9, crouchStep: 10, crouchHurt: 11 };
// Projétil da forma de armadura (adendo 6). O tikinho tem ciclo de um elemento só (sirene, agora vermelha) e o
// gilpp cicla camisa, calça e chapéu de São João; com isso os dois passam pela mesma função e o Player não
// precisa saber quem é quem. Cada nome do ciclo já é a CHAVE de textura carregada pelo Boot (sem atlas).
OBP.ProjLogic = {
  textura(h, n) { const c = h.projetil.ciclo; return c[((n % c.length) + c.length) % c.length]; },
};
OBP.HEROIS = {
  tikinho: {
    id: 'tikinho', nome: 'TIKINHO', prefixo: 'tk', tira: 'assets/sprites/tikinho/tk-tira.png', celula: 64,
    celulaArmadura: 96, armaduraId: 'tikinho-armadura', tiraArmadura: 'assets/sprites/tikinho-armadura/tka-tira.png', andarArmaduraFps: 16,
    hitbox: { w: 24, h: 52 }, hitboxAgachado: { w: 24, h: 38 },
    vel: 220, acel: 2200, freio: 2640,
    v0: 590, gSubida: 1552, gQueda: 2328, apiceMs: 30, bufferMs: 133, puloPx: 112,
    // soco 7 f: frame 1 em f0, hitbox f1 a f3, recupera f4 a f6, cancela em pulo de f4; caixa 20x20 à frente, dy do topo da hitbox
    soco: { w: 20, h: 20, dy: 8, frames: 7, ativoDe: 1, ativoAte: 3, cancelaEm: 4 },
    knockback: 160, hitStop: 40, andarFps: 14, quebraReforcado: false,
    projetil: { ciclo: ['proj-sirene'], vel: 260, hitbox: 24 },
    vozes: [
      'tk-check-01', 'tk-dano-01', 'tk-extra-01', 'tk-extra-02', 'tk-extra-03',
      'tk-inicio-01', 'tk-inicio-f1', 'tk-inicio-f2', 'tk-inicio-f3', 'tk-inicio-f4', 'tk-inicio-f5', 'tk-inicio-f6', 'tk-inicio-f7', 'tk-inicio-f8',
      'tk-item-01', 'tk-jkp-01', 'tk-loja-01', 'tk-moeda-01', 'tk-morte-01', 'tk-pulo-01',
      'tk-sel-01', 'tk-soco-01', 'tk-vitchefe-01', 'tk-vitfase-01',
      // chefe (decisao 90): variedade por momento
      'tk-cinicio-01', 'tk-cinicio-02', 'tk-cinicio-03', 'tk-cganha-01', 'tk-cganha-02', 'tk-cganha-03', 'tk-cperde-02', 'tk-cperde-03',
      'tk-cvence-01', 'tk-cvence-02', 'tk-ccabeca-01', 'tk-ccabeca-02', 'tk-cbatata-01', 'tk-cbatata-02', 'tk-dano-c1', 'tk-dano-c2',
    ],
  },
  gilpp: {
    id: 'gilpp', nome: 'GILPP', prefixo: 'gp', tira: 'assets/sprites/gilpp/gp-tira.png', celula: 96,
    celulaArmadura: 128, armaduraId: 'gilpp-armadura', tiraArmadura: 'assets/sprites/gilpp-armadura/gpa-tira.png', andarArmaduraFps: 10,
    hitbox: { w: 28, h: 68 }, hitboxAgachado: { w: 28, h: 56 },
    vel: 170, acel: 1020, freio: 1276,
    v0: 626, gSubida: 1360, gQueda: 2040, apiceMs: 60, bufferMs: 167, puloPx: 144,
    // soco 11 f: antecipa f0, hitbox f1 a f4, recupera f5 a f10, não cancela; caixa 28x20
    soco: { w: 28, h: 20, dy: 12, frames: 11, ativoDe: 1, ativoAte: 4, cancelaEm: 11 },
    knockback: 240, hitStop: 60, andarFps: 12, quebraReforcado: true,
    projetil: { ciclo: ['proj-camisa', 'proj-calca', 'proj-chapeu'], vel: 260, hitbox: 24 },
    vozes: [
      'gp-check-01', 'gp-dano-01', 'gp-extra-01', 'gp-extra-02',
      'gp-inicio-01', 'gp-inicio-f1', 'gp-inicio-f2', 'gp-inicio-f3', 'gp-inicio-f4', 'gp-inicio-f5', 'gp-inicio-f6', 'gp-inicio-f7', 'gp-inicio-f8',
      'gp-item-01', 'gp-jkp-01', 'gp-loja-01', 'gp-moeda-01', 'gp-morte-01', 'gp-pulo-01',
      'gp-sel-01', 'gp-sel-02', 'gp-soco-01', 'gp-vitchefe-01', 'gp-vitfase-01',
      // chefe (decisao 90): variedade por momento
      'gp-cinicio-01', 'gp-cinicio-02', 'gp-cinicio-03', 'gp-cganha-01', 'gp-cganha-02', 'gp-cganha-03', 'gp-cperde-02', 'gp-cperde-03',
      'gp-cvence-01', 'gp-cvence-02', 'gp-ccabeca-01', 'gp-ccabeca-02', 'gp-cbatata-01', 'gp-cbatata-02', 'gp-dano-c1', 'gp-dano-c2',
    ],
  },
};
OBP.Fisica = {
  DT: 1 / 60,
  // gravidade do frame: subida enquanto vy < 0, queda quando vy >= 0, zero durante a pausa no ápice (spec 4)
  gravidade(h, vy, pausaRestante) { return pausaRestante > 0 ? 0 : (vy < 0 ? h.gSubida : h.gQueda); },
  cortar(vy) { return vy < 0 ? vy * OBP.CFG.CORTE : vy; },
  terminal(vy) { return Math.min(vy, OBP.CFG.TERMINAL); },
  // buffer por herói e coyote comum, os dois em ms de relógio de cena
  podePular(agora, ultChao, ultAperto, h) { return agora - ultAperto <= h.bufferMs && agora - ultChao <= OBP.CFG.COYOTE_MS; },
  // aceleração para o alvo; freio quando o alvo é zero ou aponta contra a velocidade atual
  andar(vx, alvo, h, dt) {
    const contra = alvo === 0 || (vx !== 0 && Math.sign(alvo) !== Math.sign(vx));
    const a = (contra ? h.freio : h.acel) * dt;
    if (vx < alvo) return Math.min(vx + a, alvo);
    if (vx > alvo) return Math.max(vx - a, alvo);
    return vx;
  },
  // Mesmo integrador do Arcade (semi-implícito a 1/60): v += g*dt; y += v*dt. Decolagem de 4 px, pausa no ápice, corte ao soltar.
  simularPulo(h, framesSegurando = Infinity) {
    const dt = this.DT;
    let vy = -h.v0, y = -OBP.CFG.DECOLAGEM, alturaMax = OBP.CFG.DECOLAGEM, pausa = 0, pausou = false, cortou = false, f = 0;
    while (f < 600) {
      f++;
      if (f > framesSegurando && !cortou) { vy = this.cortar(vy); cortou = true; }
      if (!pausou && Math.abs(vy) < OBP.CFG.APICE_V) { pausa = h.apiceMs / 1000; pausou = true; }
      const g = this.gravidade(h, vy, pausa);
      if (pausa > 0) pausa -= dt;
      vy = this.terminal(vy + g * dt);
      y += vy * dt;
      alturaMax = Math.max(alturaMax, -y);
      if (y >= 0 && vy > 0) break;
    }
    return { alturaPx: alturaMax, tiles: alturaMax / OBP.CFG.TILE, frames: f };
  },
};
