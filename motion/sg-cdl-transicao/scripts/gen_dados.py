import json, sys
m = json.load(open(sys.argv[1]))
L, Sh = m["layers"], m["shapes"]
out = ["// Gerado a partir de referencia/slide1.jpg e slide2.jpg (camadas recortadas e formas vetorizadas).",
       "// Coordenadas em px no quadro 1920x1080.", "",
       "export type Camada = {readonly src: string; readonly x: number; readonly y: number; readonly w: number; readonly h: number};", "",
       "export const camadas = {"]
for k, v in L.items():
    out.append(f'  {k.replace("-", "_")}: {{src: "{k}.png", x: {v["x"]}, y: {v["y"]}, w: {v["w"]}, h: {v["h"]}}},')
out.append("} satisfies Record<string, Camada>;\n")
out.append(f'export const LOOP_BRANCO = "{Sh["loopBranco"]}";\n')
out.append(f'export const FAIXA_AMARELA = "{Sh["faixaAmarela"]}";\n')
out.append(f'export const TRACO_PRETO = "{Sh["tracoPreto"]}";')
out.append(f'export const TRACO_PRETO_LARGURA = {Sh["tracoPretoLargura"]};\n')
out.append('''// Eixos aproximados das duas faixas amarelas do slide 2. Servem de máscara:
// o fundo amarelo do slide 1 "encolhe" ao redor deles até virar a faixa exata.
export const EIXO_FAIXA_A = "M-200,772 C-60,772 87,768 207,779 C327,790 447,830 567,893 C687,956 800,1040 1000,1210";
export const EIXO_FAIXA_B = "M2100,830 C1950,829 1807,826 1647,837 C1487,850 1167,935 1007,970 C847,1005 550,1062 250,1140";
''')
open(sys.argv[2], "w").write("\n".join(out))
