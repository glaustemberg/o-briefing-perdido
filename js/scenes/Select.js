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
    this.cameras.main.setBackgroundColor(P.branco);

    // fundo: a sala onde a premissa acontece, andando 6 px/s. tilePositionY ancora o pé da parede, igual ao Level.
    if (this.textures.exists('fundo-fase-01')) {
      const alt = this.textures.get('fundo-fase-01').getSourceImage().height;
      this.fundo = this.add.tileSprite(0, 0, 640, 360, 'fundo-fase-01').setOrigin(0);
      this.fundo.tilePositionY = Math.max(0, alt - 360);
    }
    // chão, com a mesma receita de cor do tile 0 do jogo
    this.add.rectangle(320, 322, 640, 76, P.num(P.terra));
    this.add.rectangle(320, 286, 640, 4, P.num(P.areia));

    // placa do título: o fundo é claro e cheio de prateleira, então o título ganha um papel sólido por baixo
    this.add.rectangle(320, 56, 640, 96, P.num(P.branco));
    this.add.rectangle(320, 105, 640, 2, P.num(P.contorno));
    this.add.text(320, 44, 'tikinho & gilpp', OBP.estiloTexto(32, P.contorno)).setOrigin(0.5);
    this.add.text(320, 82, 'O BRIEFING PERDIDO', OBP.estiloTexto(16, P.rim)).setOrigin(0.5);

    // os dois em pé no mesmo chão, em y=288: a diferença de 18 px entre eles passa a ser caracterização
    this.ids = ['tikinho', 'gilpp']; this.sel = 0;
    this.cartas = this.ids.map((id, i) => {
      const x = 224 + i * 192;
      const spr = this.add.sprite(x, 288, id, OBP.FRAMES.idle).setOrigin(0.5, 1);
      const nome = this.add.text(x, 300, OBP.HEROIS[id].nome, OBP.estiloTexto(16, P.branco)).setOrigin(0.5, 0);
      return { spr, nome, x };
    });
    this.barra = this.add.rectangle(224, 290, 96, 3, P.num(P.contorno));
    this.cursor = this.add.image(224, 190, 'ui-cursor').setOrigin(0.5, 1);

    // texto do rodape em branco: areia sobre a terra do chao ficava com contraste baixo demais
    this.rodape = this.add.text(320, 340, '', OBP.estiloTexto(8, P.branco)).setOrigin(0.5);
    this.aperte = this.add.text(320, 340, 'APERTE START', OBP.estiloTexto(8, P.moeda)).setOrigin(0.5);

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
    this.rodape.setVisible(!capa).setText('SETAS ESCOLHEM   ENTER CONFIRMA   ESPACO PULA   M SOCA');
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
        OBP.Musica.tocar(this, 'mus-titulo');
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
