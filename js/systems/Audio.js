// Efeitos sintetizados (spec 8): OscillatorNode mais GainNode, ruído por AudioBuffer aleatório, sem biblioteca.
// Sem WebAudio (context ausente) tudo vira no-op.
OBP.Audio = {
  ctx: null, semitom: 0, ultimaColeta: -1e9,
  init(scene) { this.ctx = (scene.sound && scene.sound.context) || null; },
  osc(tipo, f0, f1, ms, vol = 0.2, atraso = 0) {
    if (!this.ctx) return;
    const c = this.ctx, t0 = c.currentTime + atraso, o = c.createOscillator(), g = c.createGain();
    o.type = tipo; o.frequency.setValueAtTime(f0, t0);
    if (f1 !== f0) o.frequency.linearRampToValueAtTime(f1, t0 + ms / 1000);
    g.gain.setValueAtTime(vol, t0); g.gain.linearRampToValueAtTime(0.0001, t0 + ms / 1000);
    o.connect(g).connect(c.destination); o.start(t0); o.stop(t0 + ms / 1000 + 0.01);
  },
  ruido(ms, f0, f1, vol = 0.25, atraso = 0) {
    if (!this.ctx) return;
    const c = this.ctx, t0 = c.currentTime + atraso, n = Math.floor(c.sampleRate * ms / 1000);
    const buf = c.createBuffer(1, n, c.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    const s = c.createBufferSource(); s.buffer = buf;
    const f = c.createBiquadFilter(); f.type = 'lowpass';
    f.frequency.setValueAtTime(f0, t0); f.frequency.linearRampToValueAtTime(f1, t0 + ms / 1000);
    const g = c.createGain(); g.gain.setValueAtTime(vol, t0); g.gain.linearRampToValueAtTime(0.0001, t0 + ms / 1000);
    s.connect(f).connect(g).connect(c.destination); s.start(t0);
  },
  pulo() { this.osc('square', 300, 700, 90); },
  soco() { this.osc('square', 180, 90, 60); this.ruido(60, 2000, 400, 0.12); },
  bloco() { const v = 1 + (Math.random() * 0.1 - 0.05); this.ruido(80, 1200 * v, 300 * v); },
  // 880 e 1320 Hz, 40 ms cada; +1 semitom por coleta consecutiva dentro de 600 ms, até +7
  verba(agoraMs) {
    this.semitom = agoraMs - this.ultimaColeta <= 600 ? Math.min(this.semitom + 1, 7) : 0;
    this.ultimaColeta = agoraMs;
    const r = Math.pow(2, this.semitom / 12);
    this.osc('square', 880 * r, 880 * r, 40, 0.15); this.osc('square', 1320 * r, 1320 * r, 40, 0.15, 0.04);
  },
  dano() { this.osc('square', 400, 150, 150); },
  morte() { [660, 550, 440, 330, 220].forEach((f, i) => this.osc('square', f, f, 120, 0.2, i * 0.12)); },
  checkpoint() { this.osc('triangle', 660, 660, 40); this.osc('triangle', 990, 990, 40, 0.2, 0.04); },
  item() { [523, 659, 784].forEach((f, i) => this.osc('triangle', f, f, 40, 0.2, i * 0.04)); },
  pouso() { this.ruido(40, 800, 200, 0.15); },
  // prazo esgotado: três notas descendo, sem cortar nada (o jogo continua, só muda a cor do contador)
  prazoEsgotado() { [440, 330, 220].forEach((f, i) => this.osc('square', f, f, 160, 0.2, i * 0.16)); },
  // raio da nuvem: descida rápida com ruído agudo por cima (spec 8, mesma receita de osciladores)
  raio() { this.osc('sawtooth', 1400, 200, 220, 0.18); this.ruido(220, 5000, 1200, 0.12); },
  // explosão da bomba: ruído grave curto com um baixo por baixo
  explosao() { this.ruido(260, 900, 80, 0.3); this.osc('square', 120, 40, 260, 0.2); },
  // tiro da armadura: descida curta e seca, para não se confundir com o soco (que é 180 para 90 Hz em 60 ms)
  tiro() { this.osc('square', 900, 300, 70, 0.16); this.ruido(40, 4000, 1500, 0.08); },
  menuMover() { this.osc('square', 1200, 1200, 30, 0.1); },
  menuConfirmar() { this.osc('square', 800, 1200, 80, 0.15); },
};
