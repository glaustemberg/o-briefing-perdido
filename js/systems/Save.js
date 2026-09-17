// Recorde por fase e por herói (adendo 2). Só o recorde vai para o disco: o M2 não tem save de progresso.
// Todo acesso ao localStorage é embrulhado: navegador em modo privado ou com storage bloqueado lança em vez de
// devolver null, e o jogo não pode cair por causa de um número de placar.
window.OBP = window.OBP || {};
OBP.Save = {
  PREFIXO: 'obp.recorde',
  chave(fase, heroi) { return `${this.PREFIXO}.${fase}.${heroi}`; },
  // pontuação da fase = lâmpadas no registry no momento da coxinha mais o bônus de tempo (adendo 2)
  pontuacao(lampadas, bonus) { return Math.max(0, Math.trunc(lampadas)) + Math.max(0, Math.trunc(bonus)); },
  ler(fase, heroi) {
    try { return parseInt(localStorage.getItem(this.chave(fase, heroi)), 10) || 0; } catch (e) { return 0; }
  },
  // devolve true só quando o número novo supera o guardado, para a tela saber quando escrever "NOVO RECORDE"
  gravar(fase, heroi, pontos) {
    if (!(pontos > this.ler(fase, heroi))) return false;
    try { localStorage.setItem(this.chave(fase, heroi), String(Math.trunc(pontos))); } catch (e) { return false; }
    return true;
  },
};
