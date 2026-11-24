// Exemplo aprovado pelo Fellipe em 16/10/2026 ("ficou top").
// Copie pra pasta do carrossel como dados.js e troque o texto.
window.DADOS = {
  // cantos de todos os slides (a capa troca os de cima de lugar sozinha)
  cantos: { tl: '@ofellipesales', tr: '<b>IA</b> na prática', bl: 'Conteúdo', br: 'automação' },
  selo: true,          // selo do Claude na capa e no slide em destaque (false se o assunto não for Claude)
  modelo: 'Opus 5.5',  // nome que aparece na caixa de mensagem

  capa: {
    linhas: ['7 coisas que o', 'Claude faz no', 'seu Instagram'],  // 2 a 3 linhas de até uns 15 caracteres
    tag: 'quase ninguém usa a 4ª'
    // leque: [0, 3, 2]  // opcional: quais slides aparecem em leque (esquerda, meio, direita)
  },

  itens: [
    { tit: 'Edita o seu Reel inteiro',
      txt: 'Você manda o vídeo cru e ele devolve sem silêncio, acelerado e com legenda. É só pedir assim:',
      pede: 'Corta todo silêncio desse vídeo, acelera pra 1.2x e coloca legenda no estilo dos meus Reels.',
      tema: 'claro' },
    { tit: 'Escreve roteiro do seu jeito de falar',
      txt: 'Cola a transcrição dos 5 vídeos que mais deram certo. Ele aprende como você fala e escreve os próximos:',
      pede: 'Lê essas 5 transcrições e escreve 3 roteiros de 40 segundos falando do jeito que eu falo.',
      tema: 'escuro' },
    { tit: 'Escreve a legenda que segura até o “mais”',
      txt: 'Só os primeiros 125 caracteres aparecem antes do “mais”. Ele coloca o gancho inteiro nesse espaço:',
      pede: 'Escreve a legenda desse Reel com o gancho nos primeiros 125 caracteres e uma chamada só no final.',
      tema: 'creme' },
    { tit: 'Desmonta o Reel viral do seu concorrente',
      txt: 'Junta os 10 Reels que mais bombaram no perfil dele. O Claude transcreve todos e mostra o padrão:',
      pede: 'Transcreve esses 10 Reels, separa o gancho de cada um e me mostra o que eles têm em comum.',
      tema: 'escuro', destaque: 'a que quase ninguém usa' },
    { tit: 'Monta o robô que manda o link no direct',
      txt: 'Alguém comenta uma palavra no seu post e recebe o link no direct na hora. O Claude constrói isso:',
      pede: 'Cria um robô que manda o link do meu produto no direct pra quem comentar QUERO.',
      tema: 'claro' },
    { tit: 'Agenda a semana inteira de posts',
      txt: 'Conectado ao Metricool, ele agenda cada post no horário em que o seu público mais está online:',
      pede: 'Agenda esses 5 posts nos melhores horários da minha conta essa semana.',
      tema: 'creme' },
    { tit: 'Lê seus números e diz o que repetir',
      txt: 'Ele puxa alcance, salvamentos e compartilhamentos dos seus últimos 30 posts e aponta o que repetir:',
      pede: 'Olha meus últimos 30 posts e me diz quais 3 formatos eu devo repetir no próximo mês.',
      tema: 'escuro' }
  ],

  fim: {
    titulo: 'Salva esse post e testa',
    laranja: 'uma por semana.',
    texto: 'Manda pra quem ainda edita vídeo na mão.'
  }
};
