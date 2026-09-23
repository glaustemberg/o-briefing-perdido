// rolagem.js (decisao 92): a abertura e um video que so avanca com a barra de rolagem. Os quadros ficam em
// site/quadros/q-000.webp ... e sao desenhados num canvas fixo, cobrindo a janela (mesma geometria "cover" que a
// mesa usa depois, entao o ultimo quadro emenda com a mesa real sem pulo). Nos ultimos 10% o quadro faz fade
// para a foto real da mesa. Em retrato, celular ou movimento reduzido, a abertura fica parada e o site segue
// como antes (classe sem-rolagem).
(function () {
  const N = window.__QUADROS || 72;
  const sec = document.getElementById('abertura');
  const cv = document.getElementById('rolagem-canvas');
  if (!sec || !cv) return;
  const ok = matchMedia('(orientation: landscape) and (min-width: 768px)').matches
    && !matchMedia('(prefers-reduced-motion: reduce)').matches && cv.getContext;
  if (!ok) { sec.classList.add('sem-rolagem'); return; }
  document.body.classList.add('com-rolagem');
  // a tela do monitor (com o standby e o jogo) sai da secao da mesa e entra na abertura fixa: no fim da rolagem
  // ela aparece sobre o ultimo quadro, sem repetir a mesa embaixo
  const tela = document.getElementById('tela'), fixo = sec.querySelector('.abertura-fixo');
  const legenda = document.querySelector('.mesa-legenda'), mesaSec = document.getElementById('mesa');
  if (tela && fixo) {
    fixo.appendChild(tela); tela.classList.add('na-abertura');
    if (legenda) { fixo.appendChild(legenda); legenda.classList.add('na-abertura'); }
    if (mesaSec) mesaSec.classList.add('escondida');
    if (window.posicionaTela) window.posicionaTela();
  }

  const ctx = cv.getContext('2d');
  const quadros = new Array(N);
  const src = i => 'site/quadros/q-' + String(i).padStart(3, '0') + '.webp';
  const mesa = new Image(); mesa.src = 'site/mesa-tela.jpg';   // a mesa com a tela ja roxa, igual ao painel de standby

  function carrega(i) {
    return new Promise(r => {
      const im = new Image();
      im.onload = () => { quadros[i] = im; r(im); };
      im.onerror = () => r(null);
      im.src = src(i);
    });
  }
  // canvas do tamanho da janela; a imagem 1376x768 cobre a janela como background-size: cover
  let geo;
  function cobre() {
    const w = innerWidth, h = innerHeight, dpr = Math.min(devicePixelRatio || 1, 2);
    cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
    cv.style.width = w + 'px'; cv.style.height = h + 'px';
    const esc = Math.max(w / 1376, h / 768);
    geo = { w, h, dpr, dw: 1376 * esc, dh: 768 * esc };
  }
  cobre();

  let atual = -1, ultimoP = -1;
  function desenha(i, p) {
    let im = quadros[i];
    if (!im) for (let k = i; k >= 0; k--) if (quadros[k]) { im = quadros[k]; break; }
    if (!im) return;
    ctx.setTransform(geo.dpr, 0, 0, geo.dpr, 0, 0);
    ctx.globalAlpha = 1;
    ctx.drawImage(im, (geo.w - geo.dw) / 2, (geo.h - geo.dh) / 2, geo.dw, geo.dh);
    // fade para a mesa real nos ultimos 10%
    if (p > 0.9 && mesa.complete && mesa.naturalWidth) {
      ctx.globalAlpha = Math.min(1, (p - 0.9) / 0.1);
      ctx.drawImage(mesa, (geo.w - geo.dw) / 2, (geo.h - geo.dh) / 2, geo.dw, geo.dh);
      ctx.globalAlpha = 1;
    }
    atual = i; ultimoP = p;
  }
  function progresso() {
    const r = sec.getBoundingClientRect(), total = sec.offsetHeight - innerHeight;
    return total > 0 ? Math.min(1, Math.max(0, -r.top / total)) : 0;
  }
  let pedido = false;
  function tique() {
    pedido = false;
    const p = progresso(), i = Math.round(p * (N - 1));
    if (i !== atual || (p > 0.9 && Math.abs(p - ultimoP) > 0.005)) desenha(i, p);
    sec.style.setProperty('--p', p.toFixed(3));
    sec.classList.toggle('rolando', p > 0.1);
    const fim = p >= 0.97;
    if (tela) tela.classList.toggle('visivel', fim);
    if (legenda) legenda.classList.toggle('visivel', fim);
  }
  function agenda() { if (!pedido) { pedido = true; requestAnimationFrame(tique); } }
  addEventListener('scroll', agenda, { passive: true });
  addEventListener('resize', () => { cobre(); atual = -1; agenda(); });
  mesa.onload = agenda;
  window.__rolagem = { get atual() { return atual; }, get carregados() { return quadros.filter(Boolean).length; }, progresso };

  // o primeiro quadro vem ja; o resto carrega em sequencia sem travar a pagina
  carrega(0).then(() => {
    desenha(0, 0); agenda();
    (async () => { for (let i = 1; i < N; i++) { await carrega(i); if (i % 8 === 0) agenda(); } agenda(); })();
  });
})();
