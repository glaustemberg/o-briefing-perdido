(function () {
  'use strict';

  var reduzMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var mqMobile = window.matchMedia('(max-width: 768px), (orientation: portrait)');

  /* abertura: paralaxe do mouse */
  var abertura = document.getElementById('abertura');
  var imgWrap = document.getElementById('abertura-img-wrap');

  if (abertura && imgWrap && !reduzMovimento) {
    abertura.addEventListener('mousemove', function (e) {
      var rect = abertura.getBoundingClientRect();
      var relX = (e.clientX - rect.left) / rect.width - 0.5;
      var relY = (e.clientY - rect.top) / rect.height - 0.5;
      var x = relX * 16;
      var y = relY * 16;
      imgWrap.style.transform = 'translate(' + x.toFixed(2) + 'px, ' + y.toFixed(2) + 'px)';
    });
  }

  /* jogar agora: rola ate a mesa */
  var btnJogar = document.getElementById('btn-jogar');
  var mesaSecao = document.getElementById('mesa');

  if (btnJogar && mesaSecao) {
    btnJogar.addEventListener('click', function () {
      if (document.body.classList.contains('com-rolagem')) {
        window.scrollTo({ top: abertura.offsetHeight - window.innerHeight, behavior: 'smooth' });   // roda o video ate a mesa
      } else {
        mesaSecao.scrollIntoView({ behavior: reduzMovimento ? 'auto' : 'smooth', block: 'start' });
      }
    });
  }

  /* mesa: a tela do monitor sobre o retangulo verde do render, com a imagem cobrindo a janela (cover) */
  var tela = document.getElementById('tela');
  var mesaEl = document.querySelector('.mesa');
  var TELAS = {
    mesa:  { left: 29.65, top: 19.27, width: 40.70, height: 41.28, w: 1376, h: 768 },
    movel: { left: 7.29,  top: 27.40, width: 85.42, height: 28.12, w: 768,  h: 1376 }
  };
  function posicionaTela() {
    if (!tela || !mesaEl || document.body.classList.contains('tela-cheia')) return;
    var t = mqMobile.matches ? TELAS.movel : TELAS.mesa;
    var cont = tela.parentElement || mesaEl;   // na rolagem a tela mora na abertura fixa
    var W = cont.clientWidth, H = cont.clientHeight;
    var esc = Math.max(W / t.w, H / t.h), dw = t.w * esc, dh = t.h * esc;
    var ox = (W - dw) / 2, oy = (H - dh) / 2, f = 0.4;   // 0,4% de folga por lado esconde a franja verde
    tela.style.left = (ox + (t.left - f) / 100 * dw).toFixed(1) + 'px';
    tela.style.top = (oy + (t.top - f) / 100 * dh).toFixed(1) + 'px';
    tela.style.width = ((t.width + 2 * f) / 100 * dw).toFixed(1) + 'px';
    tela.style.height = ((t.height + 2 * f) / 100 * dh).toFixed(1) + 'px';
  }
  function limpaTela() { if (tela) { tela.style.left = tela.style.top = tela.style.width = tela.style.height = ''; } }
  posicionaTela();
  window.posicionaTela = posicionaTela;
  window.addEventListener('resize', posicionaTela);
  var jogoCaixa = document.getElementById('jogo-caixa');
  var standby = document.getElementById('standby');
  var btnLigar = document.getElementById('btn-ligar');
  var btnTelaCheia = document.getElementById('btn-tela-cheia');
  var btnSair = document.getElementById('btn-sair');

  var iframeEl = null;

  function ligar() {
    if (iframeEl) return;
    if (standby) standby.remove();

    iframeEl = document.createElement('iframe');
    iframeEl.src = 'jogo.html';
    iframeEl.setAttribute('allow', 'autoplay; fullscreen');
    iframeEl.tabIndex = 0;
    iframeEl.className = 'jogo-iframe';
    jogoCaixa.appendChild(iframeEl);

    iframeEl.addEventListener('load', function () {
      try { iframeEl.contentWindow.focus(); } catch (err) {}
    });
    try { iframeEl.focus(); } catch (err) {}

    if (mqMobile.matches) enterTelaCheia();
  }

  function ajustarTamanhoJogo() {
    var dpr = window.devicePixelRatio || 1;
    var w = window.innerWidth;
    var h = window.innerHeight;
    var k = Math.max(1, Math.floor(Math.min(w * dpr / 640, h * dpr / 360)));
    var larguraCss = 640 * k / dpr;
    var alturaCss = 360 * k / dpr;
    jogoCaixa.style.width = larguraCss + 'px';
    jogoCaixa.style.height = alturaCss + 'px';
  }

  function enterTelaCheia() {
    document.body.classList.add('tela-cheia');
    limpaTela();
    ajustarTamanhoJogo();
    try {
      var p = document.documentElement.requestFullscreen();
      if (p && p.catch) p.catch(function () {});
    } catch (err) {}
    try {
      if (screen.orientation && screen.orientation.lock) {
        var lockP = screen.orientation.lock('landscape');
        if (lockP && lockP.catch) lockP.catch(function () {});
      }
    } catch (err) {}
    if (iframeEl) {
      try { iframeEl.contentWindow.focus(); } catch (err) {}
    }
  }

  function exitTelaCheia() {
    document.body.classList.remove('tela-cheia');
    jogoCaixa.style.width = '';
    jogoCaixa.style.height = '';
    posicionaTela();
    if (document.fullscreenElement) {
      try {
        var p = document.exitFullscreen();
        if (p && p.catch) p.catch(function () {});
      } catch (err) {}
    }
    try {
      if (screen.orientation && screen.orientation.unlock) screen.orientation.unlock();
    } catch (err) {}
  }

  function toggleTelaCheia() {
    if (document.body.classList.contains('tela-cheia')) exitTelaCheia();
    else enterTelaCheia();
  }

  if (btnLigar) {
    btnLigar.addEventListener('click', function (e) {
      e.stopPropagation();
      ligar();
    });
  }

  if (btnTelaCheia) {
    btnTelaCheia.addEventListener('click', function (e) {
      e.stopPropagation();
      toggleTelaCheia();
    });
  }

  if (btnSair) {
    btnSair.addEventListener('click', function (e) {
      e.stopPropagation();
      exitTelaCheia();
    });
  }

  if (tela) {
    tela.addEventListener('click', function () {
      if (!iframeEl) ligar();
    });
    tela.addEventListener('dblclick', function () {
      toggleTelaCheia();
    });
  }

  window.addEventListener('resize', function () {
    if (document.body.classList.contains('tela-cheia')) ajustarTamanhoJogo();
  });

  document.addEventListener('fullscreenchange', function () {
    if (!document.fullscreenElement) exitTelaCheia();
  });

  document.addEventListener('keydown', function (e) {
    if (iframeEl && (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === ' ')) {
      e.preventDefault();
    }
    if (e.key === 'f' || e.key === 'F') {
      toggleTelaCheia();
    }
    if (e.key === 'Escape' && document.body.classList.contains('tela-cheia')) {
      exitTelaCheia();
    }
  });
})();
