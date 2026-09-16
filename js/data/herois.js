// Parâmetros da seção 3 da spec e as funções puras de física que Player.js e tests/teste.html compartilham.
window.OBP = window.OBP || {};
OBP.FRAMES = { idle: 0, walk1: 1, walk2: 2, walk3: 3, jump: 4, fall: 5, punch: 6, hurt: 7 };
OBP.HEROIS = {
  tikinho: {
    id: 'tikinho', nome: 'TIKINHO', prefixo: 'tk', tira: 'assets/sprites/tikinho/tk-tira.png', celula: 64,
    hitbox: { w: 24, h: 52 },
    vel: 220, acel: 2200, freio: 2640,
    v0: 590, gSubida: 1552, gQueda: 2328, apiceMs: 30, bufferMs: 133, puloPx: 112,
    // soco 7 f: frame 1 em f0, hitbox f1 a f3, recupera f4 a f6, cancela em pulo de f4; caixa 20x20 à frente, dy do topo da hitbox
    soco: { w: 20, h: 20, dy: 8, frames: 7, ativoDe: 1, ativoAte: 3, cancelaEm: 4 },
    knockback: 160, hitStop: 40, andarFps: 12, quebraReforcado: false,
    vozes: ['tk-pulo-01', 'tk-soco-01', 'tk-dano-01', 'tk-morte-01', 'tk-check-01', 'tk-inicio-01', 'tk-inicio-f1', 'tk-moeda-01', 'tk-vitfase-01', 'tk-sel-01'],
  },
  gilpp: {
    id: 'gilpp', nome: 'GILPP', prefixo: 'gp', tira: 'assets/sprites/gilpp/gp-tira.png', celula: 96,
    hitbox: { w: 28, h: 68 },
    vel: 170, acel: 1020, freio: 1276,
    v0: 626, gSubida: 1360, gQueda: 2040, apiceMs: 60, bufferMs: 167, puloPx: 144,
    // soco 11 f: antecipa f0, hitbox f1 a f4, recupera f5 a f10, não cancela; caixa 28x20
    soco: { w: 28, h: 20, dy: 12, frames: 11, ativoDe: 1, ativoAte: 4, cancelaEm: 11 },
    knockback: 240, hitStop: 60, andarFps: 10, quebraReforcado: true,
    vozes: ['gp-pulo-01', 'gp-soco-01', 'gp-dano-01', 'gp-morte-01', 'gp-check-01', 'gp-inicio-01', 'gp-inicio-f1', 'gp-moeda-01', 'gp-vitfase-01', 'gp-sel-01'],
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
