# AMBIENTES DO JPV — o mundo dele travado

Mesma lógica do corpo: sem referência fixa o modelo inventa um cenário novo a cada geração e o perfil deixa de parecer a vida de UMA pessoa. Cada ambiente é gerado UMA vez (master shot), aprovado, salvo como asset no Morphix e reusado como `assetIds` em toda foto/vídeo daquele lugar.

## Método

1. **Master shot**: gerar o ambiente em plano aberto, com todos os detalhes que vão se repetir (cor da parede, móveis, bagunça característica, vista da janela).
2. **Ângulos alternativos**: gerar 2-3 variações usando o master como referência, pra o modelo entender que é o MESMO cômodo de outro ângulo.
3. **Uso**: todo prompt daquele lugar leva master + ângulo + as refs do personagem.
4. Descrever no prompt os **objetos-assinatura** do lugar (os mesmos sempre) é tão importante quanto a referência visual.

## Registro de classe (decidido 27/08/2026): DINHEIRO SILENCIOSO

O mundo dele é caro sem gritar: concreto aparente, madeira, couro gasto, luz quente e pouca, muito espaço vazio. Nada de mármore brilhoso, dourado, showroom, jatinho, iate ou penthouse de Dubai. O apartamento é alto e tem vista, mas tem manta amassada e caneca no chão. **É a bagunça que prova que alguém mora ali** — sem ela vira catálogo de imobiliária.

⚠️ Ambiente rico NÃO substitui o pilar de trabalho. A cozinha com boleto às 22h e a mesa bagunçada às 3h continuam na lista e são as fotos que dão lastro pro resto.

## Lista de ambientes (prioridade)

| # | Ambiente | Por que | Status |
|---|---|---|---|
| 1 | Apartamento: sala + varanda | Onde mora a maior parte do conteúdo | ✅ master `88ee4cd2-34c7-4e4b-ad57-4feae4769ff6` (falta gerar 2-3 ângulos usando ele como ref) |
| 2 | Banheiro | Selfie, escovar dente, espelho, rotina | ✅ `23860ef8-aea7-4262-95f0-de27cd693da6` (frame do vídeo, vira o banheiro oficial) |
| 3 | Academia à noite | Pilar fitness do feed | ✅ `9cf588c4-feac-4807-bd21-49d8e913be17` (academia clara, boné, fone — frame de melhor identidade até hoje) |
| 4 | Interior da G-Wagon preta | Carro já é assinatura no feed dele | ✅ `b4aeb7ca-0394-42b2-bb94-067d7ce754cd` (garagem à noite) |
| 5 | Quiosque de praia | ✅ `316b285d-59ea-4a67-b4da-6c1915608e48` | aprovado |
| 6 | Café/mesa de trabalho noturna | Pilar autoridade | ✅ `2db039d6-1c69-4fae-825b-7028e6d66507` |
| 7 | Aeroporto | Viagem | ✅ `b169a9d6-9214-4bdc-9f37-e104715914b9` |
| 8 | **Sala de concreto** (parede de concreto aparente, sofá chesterfield caramelo, piso de madeira clara, arara preta) | O ambiente MAIS no registro de dinheiro silencioso que ele já teve, e o lote mais consistente de identidade | ✅ `c661052e-c5d0-49cd-8a4d-e68048c40374` (base sem tripé) |
| 9 | Cozinha à noite, pendente batendo reto | Pilar trabalho/esforço — o contraponto que dá lastro | ✅ `fbc095f1-5038-49d0-99b7-0cad13b3b498` |
| 10 | Restaurante escuro, mesa de canto, flash | Social sem ostentação | ✅ `4676f192-4161-4359-97ba-e999a00f14a9` |
| 11 | Clube privado / lounge de couro e carvalho | Registro exato de dinheiro silencioso; ele já explorou em 21/08 | a gerar (ver prompt de referência em `346f6028`) |

## Objetos-assinatura por ambiente (repetir SEMPRE)

- **Banheiro**: box de vidro com respingo seco no espelho, toalha cinza torta no gancho, tubo de pasta aberto, pente preto e desodorante na bancada, prateleira com shampoo.
- **Apartamento** (definir no master): sofá, mesa de jantar que vira mesa de trabalho, varanda com parapeito de concreto e vista de morro, planta meio acabada, tênis jogado na porta.
- **Academia**: escura, luz de LED azulada, espelho grande, anilhas espalhadas, garrafa preta.
- **Carro**: G-Wagon preta, painel escuro, óculos no porta-treco, chave em cima do banco.
- **Sala de concreto**: parede de concreto aparente com juntas visíveis, sofá chesterfield de couro caramelo, piso de madeira clara, arara de metal preto encostada na parede, luz dura entrando de lado e jogando a sombra da arara no concreto.
- **Cozinha**: pendente quente batendo reto de cima, cantos no escuro, bancada clara, envelopes e papel espalhados, calculadora, caneca, cadeira de madeira.
- **Clube privado**: pedra escura e carvalho claro, poltrona baixa de couro, mesa lateral com um copo só, cortina pesada, duas pessoas ao fundo desfocadas e distantes, luz de abajur baixa. Zero decoração, zero placa, zero dourado.
