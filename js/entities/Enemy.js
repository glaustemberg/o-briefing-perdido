// Inimigos genéricos (spec 4 e adendo 7). Uma classe só com a família de comportamento vindo de OBP.INIMIGOS,
// porque os cinco casos compartilham corpo 28x28, morte com knockback e giro, e só divergem no update.
// 32x32 com hitbox 28x28 (2 px menor por lado, spec 2.5); contato tira 1 coração; 1 soco ou projétil mata.
// Cada estado troca de TEXTURA inteira (o Boot carrega uma imagem por chave 'ini-*'/'proj-*', arte final sem
// atlas): não existe folha 'inimigos32' nesta versão, por isso não há OBP.frame() aqui, só setTexture.
OBP.Enemy = class extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, tipo) {
    const t = OBP.INIMIGOS[tipo];
    if (!t) throw new Error(`inimigo desconhecido: ${tipo}`);
    super(scene, x, y, t.frame);
    scene.add.existing(this); scene.physics.add.existing(this);
    // a dificuldade escala a tabela do tipo numa cópia: velocidade e intervalo entre pulos (decisão 84)
    const d = OBP.dif(scene.registry);
    this.tipo = tipo; this.ritmo = d.ritmo;
    this.t = Object.assign({}, t, { vel: t.vel && t.vel * d.vel, pulaCada: t.pulaCada && t.pulaCada * d.ritmo });
    // sprite maior que um tile (menina 64, abacaxi 48) cresce para CIMA: o mapa marca o tile do pe, entao o centro
    // sobe metade do excedente e a hitbox fica colada na base da imagem, do mesmo jeito que a de 32x32 (decisao 68).
    const img = scene.textures.get(t.frame).getSourceImage();
    if (img.height !== 32) this.y -= (img.height - 32) / 2;
    const [cw, ch] = t.corpo || [28, 28];
    this.body.setSize(cw, ch).setOffset((img.width - cw) / 2, img.height - ch - 2);
    this.fisicaOk = false;
    this.body.setAllowGravity(t.grav > 0);
    this.body.setGravityY(t.grav);
    this.dir = -1; this.morto = false; this.morreuEm = 0;
    this.invencivel = !!t.invencivel; this.fere = t.fere !== false;
    this.proximo = -1;  // relógio do próximo ato; -1 = ainda não iniciado (o primeiro update calibra)
    this.aviso = 0;     // fim do tell de 500 ms da nuvem
    this.pousou = -1; this.explodiu = -1; this.quiques = 0; this.noChao = false; // relógios e quiques da bomba
    this.proximoPulo = null;            // relógio do pulo do abacaxi
  }
  // BUG ate a decisao 68: o PhysicsGroup do Phaser reaplica os defaults dele (gravidade, quique e velocidade
  // zeradas) em quem entra no grupo, e o Level adiciona o inimigo DEPOIS do construtor. Resultado: gravidade 0 em
  // todo mundo, ninguem encostava no chao, blocked.down era sempre falso e por isso o abacaxi nunca pulava, a
  // bomba nunca quicava e ninguem virava na beirada. A fisica do arquetipo e reaplicada aqui, ja dentro do grupo.
  aplicarFisica() {
    this.fisicaOk = true;
    this.body.setAllowGravity(this.t.grav > 0);
    this.body.setGravityY(this.t.grav);
    if (this.t.quique) this.body.setBounceY(this.t.quique);
  }
  update(t, dt) {
    const b = this.body;
    if (!this.fisicaOk) this.aplicarFisica();
    if (this.morto) {
      // reusa o giro e a expiração de OBP.Pedacos (Block.js) em vez de duplicar a mesma conta de ângulo
      if (OBP.Pedacos.passo(this, this.morreuEm, t)) this.destroy();
      return;
    }
    if (this.t.fam === 'patrulha') this.patrulhar(b, t);
    else if (this.t.fam === 'nuvem') this.comoNuvem(b, t);
    else if (this.t.fam === 'loira') this.comoLoira(b, t);
    else if (this.t.fam === 'bomba') this.comoBomba(b, t);
    else if (this.t.fam === 'fantasma') this.comoFantasma(b, t);
    else if (this.t.fam === 'raio' && (b.blocked.down || this.y > this.scene.map.heightInPixels)) this.destroy();
  }
  // post-it e abacaxi: andam, invertem na parede e na beirada; o abacaxi pula buraco pequeno em vez de virar.
  // quem tem `frames` (só o abacaxi) cicla os 3 quadros de corrida a cada 120 ms.
  patrulhar(b, t) {
    if (b.blocked.left) this.dir = 1; else if (b.blocked.right) this.dir = -1;
    if (b.blocked.down) {
      const tx = Math.floor((b.center.x + this.dir * 16) / 32), ty = Math.floor((b.bottom + 2) / 32);
      const abaixo = this.scene.camada.getTileAt(tx, ty);
      if (!abaixo || !abaixo.collides) {
        // buraco pequeno é o que tem chão a 2 tiles do outro lado; sem chão à vista, vira como o post-it
        const alem = this.scene.camada.getTileAt(tx + this.dir * 2, ty);
        if (this.t.pula && alem && alem.collides) b.setVelocityY(-this.t.pula);
        else this.dir *= -1;
      }
    }
    // pulo periodico (pedido do Berg 17/09): o abacaxi corre e vai pulando. O instante inicial sai da posicao,
    // entao dois abacaxis vizinhos nao pulam em sincronia e o padrao nao fica mecanico.
    if (this.t.pulaCada && b.blocked.down) {
      if (this.proximoPulo == null) this.proximoPulo = t + (Math.abs(Math.round(this.x)) % this.t.pulaCada);
      if (t >= this.proximoPulo) {
        b.setVelocityY(-this.t.pula); this.proximoPulo = t + this.t.pulaCada;
        // som e resmungo so perto do heroi (decisao 70): a fase tem 7 abacaxis, sem esse filtro viram uma feira
        const perto = Math.abs(this.x - this.scene.player.x);
        if (perto < 340) OBP.Audio.pulinho();
        if (perto < 220) OBP.VozInimigo.falar(this.scene, 'abacaxi-resmungo', { variantes: 3 });
      }
    }
    b.setVelocityX(this.dir * this.t.vel);
    this.setFlipX(this.dir > 0);
    if (this.t.frames) this.setTexture(this.t.frames[Math.floor(t / 120) % this.t.frames.length]);
  }
  // fantasma da revisao (decisao 88): 300 ms de susto parado ao sair do bloco, depois persegue o heroi nos dois
  // eixos a 110 px/s (o heroi anda a 208, da para fugir), com um bob em seno. Some sozinho depois de `dura` ms
  // (escalado pelo ritmo da dificuldade) ou quando o heroi ja esta a mais de 720 px, como o fantasma do Alex Kidd.
  comoFantasma(b, t) {
    if (this.nasceu === undefined) { this.nasceu = t; this.setDepth(20); }
    const p = this.scene.player, dx = p.x - this.x, dy = (p.y - 16) - this.y, vivo = t - this.nasceu;
    if (vivo > this.t.dura * this.ritmo || Math.abs(dx) > 720) {
      this.alpha -= 0.06; b.setVelocity(0, -20);
      if (this.alpha <= 0) this.destroy();
      return;
    }
    if (vivo < 300) { b.setVelocity(0, -40); this.setTexture(this.t.frameGrita); return; }
    this.dir = Math.sign(dx) || 1; this.setFlipX(this.dir > 0);
    const v = this.t.vel;
    b.setVelocity(Phaser.Math.Clamp(dx * 2, -v, v), Phaser.Math.Clamp(dy * 2, -v * 0.7, v * 0.7) + Math.sin(vivo / 160) * 40);
    this.setTexture(this.t.frames[Math.floor(vivo / 200) % 2]);
  }
  // nuvem: flutua no alto, persegue o herói em x, para em cima dele, avisa 500 ms e solta o raio; 1,3 s de descanso
  comoNuvem(b, t) {
    if (this.aviso > 0) {
      this.setTexture(this.t.frameAviso); b.setVelocityX(0);
      if (t >= this.aviso) {
        this.aviso = 0; this.proximo = t + 1300 * this.ritmo;
        const r = new OBP.Enemy(this.scene, this.x, this.y + 24, 'raio');
        this.scene.inimigos.add(r);
        r.body.setVelocityY(300);
        OBP.Audio.raio();
      }
      return;
    }
    if (this.proximo > 0 && t < this.proximo) { this.setTexture(this.t.frameDorme); b.setVelocityX(0); return; }
    this.setTexture(this.t.frame);
    const dx = this.scene.player.x - this.x;
    if (Math.abs(dx) > 480) { b.setVelocityX(0); return; }   // so persegue quem esta perto (revisao 7)
    if (Math.abs(dx) < 8) {
      b.setVelocityX(0); this.aviso = t + 500;   // 500 ms de tell, igual ao dos chefes (spec 6)
      OBP.Audio.acordar();
      OBP.VozInimigo.falar(this.scene, 'nuvem-raio');
    }
    else { this.dir = Math.sign(dx); b.setVelocityX(this.dir * this.t.vel); }
  }
  // menina loira: parada de costas, arremessa uma bomba em arco a cada ESPERA ms (1,7 s desde a decisão 67). Na
  // espera alterna idle/frameAlt (blink lento) pra não ficar estática; frameArremessa é o recuo de 200 ms.
  // Decisao 76 (Berg): o arco subiu, e a cada 3 bombas seguidas ela cansa e a quarta demora mais que o dobro.
  comoLoira(b, t) {
    const ESPERA = 1700 * this.ritmo, CANSADA = 3800 * this.ritmo, LOTE = 3;
    const espera = () => (this.arremessos > 0 && this.arremessos % LOTE === 0 ? CANSADA : ESPERA);
    b.setVelocityX(0);
    if (Math.abs(this.scene.player.x - this.x) > 520) { this.setTexture(this.t.frame); return; }   // fora da tela nao arremessa (revisao 7)
    if (this.proximo < 0) { this.arremessos = 0; this.proximo = t + ESPERA; return; }
    this.dir = Math.sign(this.scene.player.x - this.x) || 1;
    if (t < this.proximo) {
      if (t < this.proximo - (espera() - 200)) this.setTexture(this.t.frameArremessa);
      else this.setTexture(Math.floor(t / 600) % 2 === 0 ? this.t.frame : this.t.frameAlt);
      return;
    }
    this.arremessos++;
    this.proximo = t + espera();
    OBP.Audio.arremesso();
    OBP.VozInimigo.falar(this.scene, 'loira-tiro');
    const bomba = new OBP.Enemy(this.scene, this.x + this.dir * 12, this.y - 12, 'bomba');
    this.scene.inimigos.add(bomba);
    // arco alto: 380 de subida com gravidade 1000 da 72 px de altura (2,25 tiles) contra os 34 px de antes, e
    // 114 px de alcance. A bomba passa por cima de mesa e plataforma baixa em vez de bater nelas.
    bomba.body.setVelocity(this.dir * 150, -380);
  }
  // bomba (decisao 68): voa, quica 3 vezes no chao piscando cada vez mais rapido e explode no terceiro toque.
  // Encostar nela em qualquer instante explode na hora e mata o heroi, e quem trata isso e o Level.
  comoBomba(b, t) {
    if (this.explodiu >= 0) {                       // hazard de 48x48 por 300 ms
      this.setVisible(Math.floor(t / 33) % 2 === 0);
      if (t > this.explodiu + 300) this.destroy();
      return;
    }
    if (this.y > this.scene.map.heightInPixels) return this.destroy();   // caiu num buraco: some sem explodir
    if (b.blocked.down) {
      if (!this.noChao) {                            // transicao no ar -> chao: conta um quique
        this.noChao = true; this.quiques++;
        this.setTexture(this.t.framePousada);
        b.setVelocityX(b.velocity.x * 0.6);          // perde embalo a cada toque em vez de parar seco
        if (Math.abs(this.x - this.scene.player.x) < 400) OBP.Audio.quique();
        if (this.quiques >= this.t.quiquesAteExplodir) return this.explodir(t);
      }
    } else this.noChao = false;
    // pisca a partir do primeiro quique, mais rapido a cada um: 150, 100 e 50 ms
    if (this.quiques > 0) this.setVisible(Math.floor(t / (200 - this.quiques * 50)) % 2 === 0);
  }
  explodir(t) {
    if (this.explodiu >= 0) return;
    this.explodiu = t; this.fere = true; this.setVisible(true);
    this.body.setSize(48, 48).setOffset(-8, -8);   // hazard avulso maior que o sprite (adendo 7)
    this.body.setVelocity(0, 0); this.body.setAllowGravity(false);
    OBP.Audio.explosao();
    OBP.Pedacos.spawn(this.scene, this.x, this.y, 'estrela32');
  }
  morrer(dir, knockback) {
    this.morto = true; this.morreuEm = this.scene.time.now;
    OBP.Audio.morteInimigo();
    if (this.t.frameMorto) this.setTexture(this.t.frameMorto);
    this.body.setAllowGravity(true); this.body.setGravityY(1000);
    // a nuvem já está no ar: knockback só horizontal, ela despenca (adendo 7)
    this.body.setVelocity(dir * knockback, this.t.fam === 'nuvem' ? 0 : -200);
  }
};
