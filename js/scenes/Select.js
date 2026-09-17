// Capa e seleção numa cena só (decisão 69). O Boot entrega direto para cá: antes o título vivia numa tela de
// texto puro do Boot que morria no primeiro toque, e a seleção era outra tela preta. Agora é o mesmo lugar em
// dois estados, 'capa' e 'escolha', com o estúdio da fase 1 de fundo. Direção fechada a partir dos três pareceres:
// fundo claro e cenário real (impeccable), escala 8/16/32 e título em minúsculo (ui-styling), e movimento por
// passos inteiros com respiração dessincronizada (genjutsu). O primeiro toque também é o gesto que libera o áudio
// do navegador, e é nele que a música do título entra.
OBP.Select = class extends Phaser.Scene {
  constructor() { super('Select'); }
  // manter: true chega da loja. Sem isso a Seleção zeraria as lâmpadas e o bônus recém-comprado no confirmar.
  init(data) { this.manter = !!(data && data.manter); }

  // cursor de seleção: triângulo de 16x9 apontando para baixo, desenhado aqui para não girar o ui-seta (girar
  // sprite em pixel art quebra a grade)
  static criarCursor(scene) {
    const P = OBP.PAL, l = [];
    for (let y = 0; y < 9; y++) l.push('.'.repeat(y) + '#'.repeat(16 - y * 2) + '.'.repeat(y));
    OBP.pixels(scene, 'ui-cursor', l, { '#': P.contorno });
  }

  create() {
    const P = OBP.PAL;
    OBP.Select.criarCursor(this);
    this.cameras.main.setBackgroundColor(P.roxoSombra);

    // O estúdio vira a mesma sala à noite, sob luz roxa: o tint multiplica o creme do fundo pelo roxo da marca
    // (decisão 72, pedido do Berg de mais roxo). A sala continua sendo a sala, sem asset novo.
    if (this.textures.exists('fundo-fase-01')) {
      const alt = this.textures.get('fundo-fase-01').getSourceImage().height;
      this.fundo = this.add.tileSprite(0, 0, 640, 360, 'fundo-fase-01').setOrigin(0).setTint(P.num(P.roxoF5c));
      this.fundo.tilePositionY = Math.max(0, alt - 360);
    }
    // vinheta em 2 degraus, do jeito que um console de 8 bits faria: faixa, não gradiente. Mais que isso vira
    // moldura preta e encolhe a tela.
    [[0, 6, 0.35], [6, 14, 0.15]].forEach(([de, ate, a]) => {
      const c = P.num(P.contorno), e = ate - de;
      this.add.rectangle(320, de + e / 2, 640, e, c, a);
      this.add.rectangle(320, 360 - de - e / 2, 640, e, c, a);
      this.add.rectangle(de + e / 2, 180, e, 360, c, a);
      this.add.rectangle(640 - de - e / 2, 180, e, 360, c, a);
    });

    // duas faixas diagonais de luz atravessando a sala, bem discretas: dão profundidade sem virar enfeite
    [[-120, 120], [300, 200]].forEach(([x, larg]) => this.add.polygon(0, 0,
      [x, 108, x + larg, 108, x + larg + 140, 292, x + 140, 292], P.num(P.branco), 0.05).setOrigin(0));

    // dois holofotes roxos abrindo de cima, em dois degraus: é o que transforma a sala em palco
    this.focos = [224, 416].map(x => [
      this.add.polygon(0, 0, [x - 26, 108, x + 26, 108, x + 92, 292, x - 92, 292], P.num(P.roxoBrilho), 0.14).setOrigin(0),
      this.add.polygon(0, 0, [x - 14, 108, x + 14, 108, x + 52, 292, x - 52, 292], P.num(P.roxoBrilho), 0.14).setOrigin(0),
    ]);
    // poço de luz no chão, sob os pés: sem ele o herói de roupa preta some no roxo escuro
    this.pocos = [224, 416].map(x => this.add.ellipse(x, 289, 120, 22, P.num(P.roxoBrilho), 0.3));

    // chão de palco, roxo escuro com fio de neon
    this.add.rectangle(320, 324, 640, 72, P.num(P.roxoSombra));
    this.add.rectangle(320, 289, 640, 2, P.num(P.roxoBrilho));
    this.add.rectangle(320, 292, 640, 1, P.num(P.roxo));

    // faixa do título: roxo escuro entre dois fios de neon, e o título em amarelo com sombra dura
    this.add.rectangle(320, 56, 640, 96, P.num(P.roxoSombra), 0.92);
    this.add.rectangle(320, 8, 640, 2, P.num(P.roxoBrilho));
    this.add.rectangle(320, 104, 640, 2, P.num(P.roxoBrilho));
    this.add.text(323, 47, 'tikinho & gilpp', OBP.estiloTexto(32, P.roxoF5a)).setOrigin(0.5);   // sombra dura
    this.titulo = this.add.text(320, 44, 'tikinho & gilpp', OBP.estiloTexto(32, P.moeda)).setOrigin(0.5);
    this.titulo.setStroke(P.contorno, 4);
    this.add.text(320, 82, 'O BRIEFING PERDIDO', OBP.estiloTexto(16, P.branco)).setOrigin(0.5);
    // brilho que varre o título de 4 em 4 s
    this.brilho = this.add.rectangle(-40, 56, 18, 104, P.num(P.branco), 0.22).setAngle(18).setBlendMode(Phaser.BlendModes.ADD);

    // faíscas roxas subindo, 14 quadradinhos de 2 px em velocidades diferentes
    this.faiscas = Array.from({ length: 14 }, () => {
      const f = this.add.rectangle(Phaser.Math.Between(8, 632), Phaser.Math.Between(120, 340), 2, 2,
        P.num(Phaser.Math.RND.pick([P.roxoBrilho, P.roxoF5d, P.moeda])));
      f.vy = Phaser.Math.FloatBetween(0.18, 0.5);
      return f;
    });

    // os dois em pé no mesmo chão, em y=288: a diferença de 18 px entre eles passa a ser caracterização
    this.ids = ['tikinho', 'gilpp']; this.sel = 0;
    this.cartas = this.ids.map((id, i) => {
      const x = 224 + i * 192;
      const spr = this.add.sprite(x, 288, id, OBP.FRAMES.idle).setOrigin(0.5, 1);
      const nome = this.add.text(x, 300, OBP.HEROIS[id].nome, OBP.estiloTexto(16, P.branco)).setOrigin(0.5, 0);
      nome.setStroke(P.contorno, 4);
      return { spr, nome, x };
    });
    this.barra = this.add.rectangle(224, 290, 96, 3, P.num(P.moeda));
    this.cursor = this.add.image(224, 190, 'ui-cursor').setOrigin(0.5, 1);

    // selo da marca: a bola roxa do jogo, pulsando no canto, é o único lugar da capa onde a marca aparece de novo
    // no celular o botao de pulo mora nesse canto, entao o selo sobe para nao ficar embaixo do dedo
    if (this.textures.exists('item-bola-roxa')) this.selo = this.add.image(596, OBP.Toque.ativo ? 236 : 332, 'item-bola-roxa').setOrigin(0.5);

    this.rodape = this.add.text(320, 340, '', OBP.estiloTexto(8, P.branco)).setOrigin(0.5);
    this.aperte = this.add.text(320, 340, 'APERTE START', OBP.estiloTexto(8, P.moeda)).setOrigin(0.5);
    this.aperte.setStroke(P.contorno, 4); this.rodape.setStroke(P.contorno, 4);

    this.inp = new OBP.Input(this);
    OBP.Audio.init(this);
    this.estado = 'capa'; this.confirmado = false;
    this.trocaAte = 0; this.windupAte = 0; this.proximoPiscar = 0;
    this.respirar();
    this.atualizar();
  }

  // respiração: cada herói troca para idle2 por 200 ms em intervalos sorteados entre 1800 e 2600 ms. Metrônomo
  // igual nos dois lê como asset; o desencontro lê como gente esperando ser escolhida.
  respirar() {
    this.cartas.forEach((c, i) => {
      const ciclo = () => {
        const espera = Phaser.Math.Between(1800, 2600);
        this.time.delayedCall(espera, () => {
          if (this.confirmado || (this.estado === 'escolha' && i !== this.sel)) return ciclo();
          if (Number(c.spr.frame.name) === OBP.FRAMES.idle) {
            c.spr.setFrame(OBP.FRAMES.idle2);
            this.time.delayedCall(200, () => { if (!this.confirmado) c.spr.setFrame(OBP.FRAMES.idle); });
          }
          ciclo();
        });
      };
      this.time.delayedCall(i * 700, ciclo);
    });
  }

  atualizar() {
    const P = OBP.PAL, capa = this.estado === 'capa';
    this.cartas.forEach((c, i) => {
      const aceso = capa || i === this.sel;
      if (aceso) c.spr.clearTint(); else c.spr.setTint(P.num(P.rim));
      c.nome.setColor(aceso ? P.branco : P.rim);
    });
    this.barra.setVisible(!capa);
    this.cursor.setVisible(!capa);
    this.aperte.setVisible(capa);
    this.rodape.setVisible(!capa).setText(OBP.Toque.ativo
      ? 'TOQUE EM < E > PARA ESCOLHER   PULO CONFIRMA'
      : 'SETAS ESCOLHEM   ENTER CONFIRMA   ESPACO PULA   M SOCA');
  }

  // a troca de herói anda em 6 passos de 32 px, 20 ms cada: tween contínuo em zoom inteiro deixa a posição
  // fracionária e a borda cintila
  mover(d, t) {
    const novo = Phaser.Math.Clamp(this.sel + d, 0, this.ids.length - 1);
    if (novo === this.sel || t < this.trocaAte) return;
    this.sel = novo;
    this.trocaAte = t + 120;
    this.destino = this.cartas[this.sel].x;
    OBP.Audio.menuMover();
    const alvo = this.cartas[this.sel].spr;
    alvo.setFrame(OBP.FRAMES.windup); this.windupAte = t + 90;   // reconhece o dedo apontado
    this.atualizar();
  }

  update(t) {
    if (this.fundo) this.fundo.tilePositionX += 0.1;
    // faísca sobe e volta por baixo quando passa do teto do palco
    for (const f of this.faiscas) { f.y -= f.vy; if (f.y < 112) { f.y = 300; f.x = Phaser.Math.Between(8, 632); } }
    // brilho varre o título a cada 4 s, em 700 ms
    if (t >= (this.proximoBrilho || 0)) { this.proximoBrilho = t + 4000; this.brilho.x = -40; this.brilhando = t; }
    if (this.brilhando && t - this.brilhando < 700) this.brilho.x = -40 + (t - this.brilhando) / 700 * 720;
    if (this.selo) this.selo.y = (OBP.Toque.ativo ? 236 : 332) + (Math.floor(t / 300) % 2 ? 1 : -1);
    if (this.windupAte && t >= this.windupAte) { this.windupAte = 0; this.cartas[this.sel].spr.setFrame(OBP.FRAMES.idle); }
    // cursor e barra andam em passos de 32 px até o destino, sempre em posição inteira
    if (this.destino != null && this.cursor.x !== this.destino) {
      const passo = Math.sign(this.destino - this.cursor.x) * 32;
      this.cursor.x = Math.abs(this.destino - this.cursor.x) <= 32 ? this.destino : this.cursor.x + passo;
      this.barra.x = this.cursor.x;
      this.cursor.y = 190 - (this.sel === 1 ? 20 : 0);
    }
    if (this.confirmado) return;
    const e = this.inp.ler(), apertou = e.startAgora || e.puloAgora || e.socoAgora;

    if (this.estado === 'capa') {
      if (t >= this.proximoPiscar) { this.aperte.setVisible(!this.aperte.visible); this.proximoPiscar = t + 500; }
      if (apertou) {
        const ctx = this.sound.context;
        if (ctx && ctx.state === 'suspended') ctx.resume();     // gesto que libera o áudio do navegador
        OBP.Musica.tocar(this, 'mus-titulo', 0.3);
        this.estado = 'escolha';
        this.cursor.x = this.barra.x = this.cartas[this.sel].x;
        this.cursor.y = 190 - (this.sel === 1 ? 20 : 0);
        OBP.Audio.menuConfirmar();
        this.atualizar();
      }
      return;
    }
    if (e.esqAgora) this.mover(-1, t);
    if (e.dirAgora) this.mover(1, t);
    if (apertou) this.confirmar(t);
  }

  confirmar(t) {
    this.confirmado = true;
    const id = this.ids[this.sel], alvo = this.cartas[this.sel].spr, outro = this.cartas[1 - this.sel];
    const base = { heroi: id, coracoes: this.registry.get('coracoesMax') || OBP.CFG.CORACOES };
    this.registry.set(this.manter ? base : Object.assign(base, {
      vidas: OBP.CFG.VIDAS, lampadas: 0, prazo: 0, coracoes: OBP.CFG.CORACOES,
      coracoesMax: OBP.CFG.CORACOES, coracoesExtra: 0, pulosExtra: 0, itemGuardado: null,
    }));
    OBP.Audio.menuConfirmar(); OBP.Voice.init(this, id); OBP.Voice.falar('sel-01');
    // 400 ms, os mesmos de antes: windup, pulo de 12 px em quadros inteiros, pouso. Quem não foi escolhido senta.
    alvo.setFrame(OBP.FRAMES.windup);
    const salto = [[90, OBP.FRAMES.jump, -6], [150, OBP.FRAMES.jump, -6], [210, OBP.FRAMES.fall, 6], [270, OBP.FRAMES.fall, 6]];
    salto.forEach(([ms, f, dy]) => this.time.delayedCall(ms, () => { alvo.setFrame(f); alvo.y += dy; }));
    this.time.delayedCall(120, () => { if (outro) outro.spr.setFrame(OBP.FRAMES.crouch); });
    this.time.delayedCall(330, () => { alvo.setFrame(OBP.FRAMES.idle); OBP.Audio.pouso(); });
    this.time.delayedCall(220, () => this.cameras.main.fadeOut(180, 0, 0, 0));
    this.time.delayedCall(400, () => { OBP.Musica.parar(this); this.scene.start('Level', { fase: 'fase-01' }); });
  }
};
