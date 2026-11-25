# Transição CDL Fortaleza (SG Propag)

Motion de 5,5 s (1920x1080, 30 fps) que leva do slide "Vendemos Associação ou Solução?"
ao slide "A pergunta central não é...". Feito em Remotion, animado com uma timeline GSAP.

## Como funciona

- `src/TransicaoCDL.tsx`: a cena. A timeline GSAP é criada pausada e o Remotion faz
  `tl.seek(frame / fps)` a cada quadro, então qualquer quadro renderiza igual.
- `src/dados.ts`: posições das camadas e os caminhos vetoriais (gerado, não editar à mão).
- `public/`: textos, logo, rodapé e seta recortados dos slides originais, com transparência.
- `referencia/`: os dois slides originais.

Sequência: o slide 1 fica parado 0,8 s; os textos sobem e saem, o traço preto se recolhe
e o laço branco escorrega para fora; o fundo amarelo se estreita até virar a faixa do
slide 2; as linhas do slide 2 sobem em sequência e a seta entra. O logo e o rodapé, iguais
nos dois slides, ficam parados o tempo todo.

## Comandos

```bash
npm i
npx remotion studio                 # pré-visualizar
npx remotion render TransicaoCDL out/transicao-cdl.mp4 --codec=h264 --crf=16
```

## Refazer as camadas a partir de novos slides

Requer Python com numpy, scipy, scikit-image e Pillow.

```bash
python scripts/extract.py referencia/slide1.jpg referencia/slide2.jpg public shapes.json
python scripts/fitblack.py referencia/slide1.jpg shapes.json diff.png   # ajusta o traço preto
python scripts/gen_dados.py shapes.json src/dados.ts
python scripts/compare.py referencia/slide1.jpg out/quadro-0.png diff0.png  # confere o 1º quadro
```

Com o SVG original dos traços, `src/dados.ts` pode receber os caminhos exatos no lugar dos traçados.
