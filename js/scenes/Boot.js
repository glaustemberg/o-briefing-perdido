// Boot: carrega as tiras dos heróis, espera a fonte até 2 s e mostra "APERTE UMA TECLA" (destrava o WebAudio).
OBP.Boot = class extends Phaser.Scene {
  constructor() { super('Boot'); }
  preload() {
    this.add.text(320, 180, 'CARREGANDO', OBP.estiloTexto(16, OBP.PAL.cinzaClaro)).setOrigin(0.5);
    // Arquivo ausente (voz ainda não gravada) só avisa; o loader do Phaser segue e dispara 'complete' normalmente.
    this.load.on('loaderror', f => console.warn('asset ausente:', f.key, f.src));
    this.load.spritesheet('tikinho', 'assets/sprites/tikinho/tk-tira.png', { frameWidth: 64, frameHeight: 64 });
    this.load.spritesheet('gilpp', 'assets/sprites/gilpp/gp-tira.png', { frameWidth: 96, frameHeight: 96 });
    // o ?v= vale para TODO audio: o arquivo muda de conteudo sem mudar de nome, e sem isso o navegador serve o
    // velho do cache. A voz do heroi ficou de fora na decisao 77 e por isso o nivelamento nao chegaria ao jogador.
    const V = '?v=' + OBP.CFG.VERSAO_AUDIO;
    for (const id of ['tikinho', 'gilpp']) for (const v of OBP.HEROIS[id].vozes) this.load.audio(v, `assets/vozes/${id}/${v}.wav` + V);
    // falas dos inimigos (decisao 70): canal proprio, ids 'ini-*' que o OBP.VozInimigo procura no cache
    for (const v of ['abacaxi-resmungo-01', 'abacaxi-resmungo-02', 'abacaxi-resmungo-03', 'abacaxi-acerto',
                     'loira-tiro', 'loira-acerto', 'nuvem-raio', 'nuvem-acerto', 'chefe-01', 'chefe-02'])
      this.load.audio('ini-' + v, `assets/vozes/inimigos/ini-${v}.wav` + V);
    // Arte final da fase 1. As texturas provisorias de Level/Item/Enemy so nascem se a chave nao existir,
    // entao carregar aqui com a MESMA chave faz o jogo usar a arte sem mudar logica nenhuma.
    // um tileset e um fundo por fase do escopo cortado (1 Estudio, 2 Reuniao, 5 Grafica, 8 Torre).
    // A fase 8 tem dois mapas (08a e 08b) e usa a mesma arte, por isso a chave vem sem a letra.
    for (const f of ['fase-01', 'fase-02', 'fase-05', 'fase-08']) {
      this.load.image('tiles-' + f, `assets/tiles/${f}/tileset-leg.png`);
      this.load.image('fundo-' + f, `assets/fundos/${f}.png`);
    }
    // arena do chefe (decisao 85): fundo proprio, o tileset da torre com outra chave, as maos do jokenpo e o
    // Sobrinho em pedacos (a cabeca que voa e o corpo que fica)
    this.load.image('fundo-chefe', 'assets/fundos/chefe.png');
    this.load.image('tiles-chefe', 'assets/tiles/fase-08/tileset-leg.png');
    for (const k of ['pedra', 'papel', 'tesoura']) this.load.image('jkp-' + k, 'assets/tiles/itens/jkp-' + k + '.png');
    this.load.image('sob-cabeca', 'assets/sprites/sobrinho/sob-cabeca.png');
    this.load.image('sob-corpo', 'assets/sprites/sobrinho/sob-corpo.png');
    const T = 'assets/tiles/fase-01/';
    this.load.image('coxinha', T + 'item-coxinha.png');
    this.load.image('check-off', T + 'item-checkpoint-off.png');
    this.load.image('check-on', T + 'item-checkpoint-on.png');
    // M2: formas de armadura, itens, projeteis e os inimigos novos (decisoes 43 a 53)
    this.load.spritesheet('tikinho-armadura', 'assets/sprites/tikinho-armadura/tka-tira.png', { frameWidth: 96, frameHeight: 96 });
    this.load.spritesheet('gilpp-armadura', 'assets/sprites/gilpp-armadura/gpa-tira.png', { frameWidth: 128, frameHeight: 128 });
    // chefe final: 8 poses de 96 px (idle, provoca, briefing, prazo, verba, dano, derrotado, ri)
    this.load.spritesheet('sobrinho', 'assets/sprites/sobrinho/sob-tira.png', { frameWidth: 96, frameHeight: 96 });
    const I = 'assets/tiles/itens/', N = 'assets/tiles/inimigos/';
    for (const k of ['lampada', 'lampada-apagada', 'cafe', 'energetico', 'coracao', 'coracao-vazio', 'relogio', 'trofeu'])
      this.load.image('item-' + k, I + 'item-' + k + '.png');
    this.load.image('item-bola-roxa', I + 'item-bola-roxa-48.png');       // unico item de 48 px (decisao 52)
    for (const k of ['sirene', 'camisa', 'calca', 'chapeu', 'raio']) this.load.image('proj-' + k, I + 'proj-' + k + '.png');
    this.load.image('proj-bomba', I + 'inimigo-bomba.png');
    this.load.image('ui-seta', I + 'ui-seta.png');
    for (const k of ['nuvem-a', 'nuvem-dorme', 'nuvem-raio', 'loira-idle', 'loira-a', 'loira-arremessa',
                     'abacaxi-a', 'abacaxi-b', 'abacaxi-c', 'abacaxi-morto', 'bomba-solta'])
      this.load.image('ini-' + k, N + 'inimigo-' + k + '.png');
    this.load.image('proj-raio-solto', N + 'proj-raio-solto.png');
    // trilha (decisao 69): as duas faixas ja existiam renderizadas e nenhuma linha do jogo as tocava
    // efeitos gravados (decisao 75): substituem o bipe sintetizado onde existem
    for (const k of ['pulinho', 'arremesso', 'quique', 'acordar', 'raio', 'explosao', 'soco', 'morte-inimigo'])
      this.load.audio('sfx-' + k, `assets/sfx/sfx-${k}.wav` + V);
    // trilha: uma por fase mais a do chefe (decisao 83). Todas passam por prepara_musicas.py, que corta em 60 s
    // e nivela em -18 LUFS, sete decibeis abaixo da voz do heroi.
    for (const k of ['titulo', 'fase-01', 'fase-02', 'fase-05', 'fase-08', 'chefe', 'jokenpo'])
      this.load.audio('mus-' + k, `assets/musicas/${k}.mp3` + V);
  }
  create() {
    // Registry do M2 inteiro declarado num lugar só: chave que nasce undefined vira NaN no primeiro inc()
    this.registry.set({
      heroi: 'tikinho', dificuldade: 'medio', vidas: OBP.CFG.VIDAS, lampadas: 0, prazo: 0,
      coracoes: OBP.CFG.CORACOES, coracoesMax: OBP.CFG.CORACOES, coracoesExtra: 0,
      pulosExtra: 0, inventario: [], itemSel: 0, efeito: null,
    });
    const fonte = document.fonts ? document.fonts.load('16px "Press Start 2P"').catch(() => []) : Promise.resolve([]);
    const teto = new Promise(r => setTimeout(r, 2000));
    // a capa agora e a Select (decisao 69): o titulo em tela de texto puro morria no primeiro toque, e o gesto
    // que libera o audio do navegador passou a ser o primeiro toque da capa
    Promise.race([fonte, teto]).then(() => this.scene.start('Select'));
  }
};
