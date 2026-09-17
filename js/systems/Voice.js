// Vozes por id (spec 8). VoiceLogic é puro (testável); Voice toca pelo Phaser. Um canal: reação não interrompe
// nada, garantida substitui o que estiver tocando, urgente corta qualquer outra.
window.OBP = window.OBP || {};
OBP.VoiceLogic = {
  TETO_MS: 20000, URGENTE_MS: 4000,
  criar() { return { ultimaReacao: -1e9, ultimaUrgente: -1e9, contagens: {} }; },
  classe(id) {
    if (/-(dano|morte)-/.test(id)) return 'urgente';
    if (/-(inicio|check|vitfase|vitchefe|jkp|sel|loja)-/.test(id)) return 'garantida';
    return 'reacao';
  },
  decidir(e, id, agora) {
    const c = this.classe(id);
    if (c === 'garantida') return true;
    if (c === 'urgente') { if (agora - e.ultimaUrgente < this.URGENTE_MS) return false; e.ultimaUrgente = agora; return true; }
    if (agora - e.ultimaReacao < this.TETO_MS) return false;
    e.ultimaReacao = agora; return true;
  },
  cada(e, chave, n) { e.contagens[chave] = (e.contagens[chave] || 0) + 1; return e.contagens[chave] % n === 0; },
};
OBP.Voice = {
  scene: null, prefixo: 'tk', e: OBP.VoiceLogic.criar(), atual: null,
  init(scene, heroiId) {
    this.scene = scene;
    const p = OBP.HEROIS[heroiId].prefixo;
    if (p !== this.prefixo) this.e = OBP.VoiceLogic.criar(); // troca de herói zera os cooldowns
    this.prefixo = p;
  },
  falar(sufixo) {
    if (!this.scene) return false;
    const id = `${this.prefixo}-${sufixo}`, agora = this.scene.time.now, classe = OBP.VoiceLogic.classe(id);
    if (!this.scene.cache.audio.exists(id)) return false; // WAV ainda não gravado: silêncio, sem gastar cooldown
    const tocando = this.atual && this.atual.isPlaying;
    if (tocando && classe === 'reacao') return false;
    if (!OBP.VoiceLogic.decidir(this.e, id, agora)) return false;
    if (tocando) this.atual.stop();
    const som = this.scene.sound.add(id);
    // 'complete' cobre o fim natural; 'stop' cobre o corte por uma fala nova (senão o Sound antigo vaza).
    const limpar = () => { som.destroy(); if (this.atual === som) this.atual = null; };
    som.once('complete', limpar);
    som.once('stop', limpar);
    this.atual = som;
    som.play();
    return true;
  },
  reacaoCada(sufixo, n) { if (OBP.VoiceLogic.cada(this.e, sufixo, n)) this.falar(sufixo); },
};
// Falas dos inimigos (decisao 70, pedido do Berg). Canal separado do herói de propósito: no mesmo canal o
// resmungo do abacaxi comeria o cooldown das falas dele. Dois freios: 2,2 s entre duas falas quaisquer e 6 s
// entre repetições do mesmo grupo. Fala de acerto é prioritária: corta o que estiver tocando e só respeita 3 s
// do próprio grupo, porque é ela que explica ao jogador quem acabou de machucá-lo.
OBP.VozInimigo = {
  GLOBAL_MS: 2200, GRUPO_MS: 6000, PRIORITARIA_MS: 3000,
  ultima: -1e9, porGrupo: {}, som: null,
  falar(scene, grupo, opc = {}) {
    if (!scene || !scene.sound) return false;
    const t = scene.time.now, n = opc.variantes || 1;
    const prio = !!opc.prioritaria;
    if (t - (this.porGrupo[grupo] || -1e9) < (prio ? this.PRIORITARIA_MS : this.GRUPO_MS)) return false;
    if (!prio && t - this.ultima < this.GLOBAL_MS) return false;
    const id = 'ini-' + grupo + (n > 1 ? '-' + String(1 + Math.floor(Math.random() * n)).padStart(2, '0') : '');
    if (!scene.cache.audio.exists(id)) return false;   // fala ainda não gravada: silêncio, sem gastar cooldown
    const tocando = this.som && this.som.isPlaying;
    if (tocando && !prio) return false;
    if (tocando) this.som.stop();
    this.ultima = t; this.porGrupo[grupo] = t;
    const som = scene.sound.add(id, { volume: 0.75 });   // 0,75 deixa o heroi na frente no mix (decisao 80)
    let limpo = false;
    const limpar = () => { if (limpo) return; limpo = true; som.destroy(); if (this.som === som) this.som = null; };
    som.once('complete', limpar); som.once('stop', limpar);
    this.som = som; som.play();
    return Math.round((som.totalDuration || 0) * 1000) || 1;   // ms, para quem quiser falar depois
  },
  // quem machucou o herói, na voz de quem machucou: a bomba fala pela menina e o raio pela nuvem
  DONO: { abacaxi: 'abacaxi-acerto', loira: 'loira-acerto', bomba: 'loira-acerto', nuvem: 'nuvem-acerto', raio: 'nuvem-acerto' },
  // devolve quantos ms o heroi deve esperar antes de responder: quem bateu fala primeiro, o heroi reage depois
  // (decisao 71, pedido do Berg). Teto de 1,6 s para a reacao nao chegar depois da tela ja ter virado.
  acertou(scene, tipo) {
    const g = this.DONO[tipo];
    const ms = g ? this.falar(scene, g, { prioritaria: true }) : 0;
    return Math.min(ms || 0, 1600);
  },
};
