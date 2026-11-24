# Esqueleto de VÍDEO (cena com movimento)

Saída: prompt em inglês, telegráfico, 8 blocos nesta ordem. Timestamps precisam somar a duração exata.

## Os 8 blocos

1. **SPEC (linha 1)**: `[duração] [aspecto] photorealistic live-action [gênero + época + estilo de transmissão]: [textura de produção: público, luz, elementos práticos, materiais reais], [pacote de câmeras do gênero]. Real-time, no CGI, no slow-mo.`
   - Proibições sempre no fim da linha 1 (é o negative prompt embutido).
   - Gênero + época carrega luz, grão e direção de câmera de graça (ex: "late-2000s prime-time TV", "handheld documentary style").
   - Pacote de câmeras por gênero: gameshow = ENG/crane/long-lens; documentário = handheld/overhead; esporte = long-lens/cable-cam; cinema = dolly/steadicam.
2. **IDENTITY**: puxar de `identidade-blair.md` (ou do personagem nomeado). Fechar sempre com `every angle, even [condição extrema da cena: wet/sweaty/flour-dusted]`.
3. **LOCATION**: `one continuous [set + hora do dia]. [ESTAÇÃO 1] > [ESTAÇÃO 2] > [ESTAÇÃO 3] > [CLÍMAX]. Same set throughout.` Estações em CAPS. Repetir "same set throughout" impede teleporte de cenário.
4. **BEATS com timestamp**: intro curta, desenvolvimento médio, clímax com a MAIOR faixa, payoff curto. Formato interno de cada beat: `CÂMERA: micro-ação`. Nomear a câmera antes da ação dá cara de transmissão real.
5. **MOMENTO-CHAVE**: decompor em 4-8 micro-beats encadeados por vírgula, nomeando partes do corpo. Ex: `hands catch the edge, one knee lands, platform tilts down, foot slips, slides back, grabs, fingers slip, falls backward`. Fechar com `Real gravity, no stunt look`.
6. **PHYSICS** (linha fixa, nunca muda): `PHYSICS: movement>contact>force>reaction>consequence.`
7. **AUDIO**: `[sfx gatilho], [ambiente/público], [narração ou falas nomeando o personagem], [foley: passos, maquinário, água], [reações], [arco musical amarrado ao clímax]`. Nomear o personagem no áudio reforça a identidade.
8. **ARC**: `[cadeia de 6-8 emoções separadas por >]. [calibração de performance: normal adult, not a pro athlete].` A calibração define como o corpo se move em TUDO.

## Exemplo canônico (Blair, water show — validado)

```
30s 16:9 photorealistic live-action Japanese water obstacle show, late-2000s prime-time TV: big crowd, practical rigs, stadium floodlights, real water, ENG/crane/long-lens/low-water cams. Real-time, no CGI, no slow-mo.
IDENTITY: reference image is the ONLY source. Same face, hair, skin tone, proportions, clothing, footwear every angle, even wet.
LOCATION: one continuous night water-arena. START PLATFORM > FLOATING MAZE > ROTATING BRIDGE > WATER DROP. Same set throughout.
0-3: sneakers step onto start platform, cut legs>waist>torso>face. Confident smile, salute, applause. Turns to course, smile drops, deep breath. Buzzer.
3-10 MAZE: sprints in. Crane wide: soft platforms on cables above water, drifting. Lands, tilts. ENG: each landing shifts it, one rotates 20-30deg, arms swing, jumps on rather than fall. Low water: foot near edge, sharp tilt, knee down, hands catch, splash, up and out.
10-19 BRIDGE: cylinders spinning at varied speeds over the pool. High wide: reads it, enters. Side: feet adjusting, second section spins opposite, lands unstable, third accelerates. ENG close: foot slips, one hand catches the rail, legs swing over water, pulls up, shocked, continues. Rear: jumps, nearly falls, recovers.
19-27 DROP: huge curved ramp to a narrow platform over the pool, long lens compresses the gap. Side low: accelerates up, launches, natural arc, arms out. Hands catch the edge, one knee lands, almost up, platform tilts down a few degrees, foot slips, slides back, grabs, fingers slip, falls backward. Real gravity, no stunt look.
27-30 END: water-level long shot, big splash. Close-up: resurfaces, hair soaked, disbelief, wipes eyes, pauses, small annoyed smile. End on her face.
PHYSICS: movement>contact>force>reaction>consequence.
AUDIO: buzzer, crowd, English commentary naming Blair, footsteps, machinery, splashes, laughter, music builds to the jump.
ARC: confident>playful>nervous>determined>near-success>failure>shocked>comedic. Normal adult, not a pro athlete.
```
