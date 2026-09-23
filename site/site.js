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
      mesaSecao.scrollIntoView({ behavior: reduzMovimento ? 'auto' : 'smooth', block: 'start' });
    });
  }

  /* mesa: ligar o jogo e tela cheia */
  var tela = document.getElementById('tela');
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
