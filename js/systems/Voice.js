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
    this.atual = this.scene.sound.add(id);
    this.atual.once('complete', () => { if (this.atual) this.atual.destroy(); this.atual = null; });
    this.atual.play();
    return true;
  },
  reacaoCada(sufixo, n) { if (OBP.VoiceLogic.cada(this.e, sufixo, n)) this.falar(sufixo); },
};
