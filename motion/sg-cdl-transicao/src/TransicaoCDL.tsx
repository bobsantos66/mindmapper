import { gsap } from "gsap";
import React, { useLayoutEffect, useRef } from "react";
import {
  AbsoluteFill,
  CanvasImage,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {
  camadas,
  EIXO_FAIXA_A,
  EIXO_FAIXA_B,
  FAIXA_AMARELA,
  LOOP_BRANCO,
  TRACO_PRETO,
  TRACO_PRETO_LARGURA,
  type Camada,
} from "./dados";

const AMARELO_1 = "#E6F101"; // fundo do slide 1
const AMARELO_2 = "#FFF100"; // faixa do slide 2
// Espessura da máscara que cobre a tela inteira: o ponto mais distante dos
// eixos das faixas fica a 960 px, então 2 x 960 + margem.
const LARGURA_TOTAL = 1960;

type Refs = {
  readonly [K in
    | "selo"
    | "vendemos"
    | "titulo"
    | "loop"
    | "traco"
    | "fundoAmarelo"
    | "faixa"
    | "mascaraA"
    | "mascaraB"
    | "linha1"
    | "linha2"
    | "linha3"
    | "linha4"
    | "linha5"
    | "seta"]: React.RefObject<HTMLDivElement | SVGElement | null>;
};

/**
 * Monta a timeline uma única vez, pausada. O Remotion controla o tempo:
 * a cada quadro chamamos tl.seek(frame / fps), então qualquer quadro pode ser
 * renderizado isoladamente e sempre sai igual.
 */
const criarTimeline = (r: Refs) => {
  const el = (k: keyof Refs) => r[k].current as gsap.TweenTarget;
  const traco = r.traco.current as SVGPathElement;
  const comprimento = traco.getTotalLength();
  gsap.set(traco, { strokeDasharray: comprimento, strokeDashoffset: 0 });

  const tl = gsap.timeline({
    paused: true,
    // lazy: false -> cada seek grava os estilos na hora; sem isso o Remotion
    // pode capturar o quadro antes de o GSAP aplicar o primeiro render.
    defaults: { ease: "power3.in", duration: 0.55, lazy: false },
  });

  // ---------------------------------------------------------------- saída slide 1
  // Quem sai, acelera (ease .in). Textos sobem por trás de uma máscara.
  tl.addLabel("saida", 0.8)
    .to(el("selo"), { yPercent: -110 }, "saida")
    .to(el("vendemos"), { yPercent: -110 }, "saida+=0.06")
    .to(el("titulo"), { yPercent: -110, duration: 0.6 }, "saida+=0.12")
    // o traço preto se recolhe do início para o fim
    .to(
      traco,
      { strokeDashoffset: -comprimento, duration: 0.7, ease: "power2.in" },
      "saida",
    )
    // o laço branco gira e escorrega para fora pelo canto
    .to(
      el("loop"),
      { x: 760, y: 520, rotation: 14, duration: 0.7, ease: "power3.in" },
      "saida+=0.05",
    );

  // ---------------------------------------------------- o amarelo vira a faixa
  // O fundo amarelo do slide 1 se estreita até sobrar só a faixa do slide 2.
  // Começa antes de o slide 1 terminar de sair, para não haver quadro vazio.
  tl.addLabel("faixa", 1.15)
    .to(
      [el("mascaraA"), el("mascaraB")],
      { attr: { "stroke-width": 0 }, duration: 1.15, ease: "power2.inOut" },
      "faixa",
    )
    .to(
      [el("fundoAmarelo"), el("faixa")],
      { attr: { fill: AMARELO_2 }, duration: 0.8, ease: "power1.inOut" },
      "faixa+=0.2",
    );

  // ------------------------------------------------------------ entrada slide 2
  // Quem chega, desacelera (ease .out). Linhas sobem de trás da máscara.
  tl.addLabel("entrada", 1.95)
    .from(
      [el("linha1"), el("linha2")],
      { yPercent: 105, duration: 0.75, ease: "power3.out", stagger: 0.1 },
      "entrada",
    )
    .from(
      [el("linha3"), el("linha4"), el("linha5")],
      { yPercent: 105, duration: 0.75, ease: "power3.out", stagger: 0.1 },
      "entrada+=0.3",
    )
    .from(
      el("seta"),
      { xPercent: -70, autoAlpha: 0, duration: 0.6, ease: "power3.out" },
      "entrada+=0.55",
    );

  return tl;
};

const Recorte: React.FC<{
  readonly camada: Camada;
  readonly innerRef?: React.Ref<HTMLDivElement>;
  readonly mascarar?: boolean;
}> = ({ camada, innerRef, mascarar = true }) => (
  <div
    style={{
      position: "absolute",
      left: camada.x,
      top: camada.y,
      width: camada.w,
      height: camada.h,
      overflow: mascarar ? "hidden" : "visible",
    }}
  >
    <div ref={innerRef} style={{ width: "100%", height: "100%" }}>
      <CanvasImage
        src={staticFile(camada.src)}
        style={{ width: camada.w, height: camada.h }}
      />
    </div>
  </div>
);

export const TransicaoCDL: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const tl = useRef<gsap.core.Timeline | null>(null);

  const refs: Refs = {
    selo: useRef(null),
    vendemos: useRef(null),
    titulo: useRef(null),
    loop: useRef(null),
    traco: useRef(null),
    fundoAmarelo: useRef(null),
    faixa: useRef(null),
    mascaraA: useRef(null),
    mascaraB: useRef(null),
    linha1: useRef(null),
    linha2: useRef(null),
    linha3: useRef(null),
    linha4: useRef(null),
    linha5: useRef(null),
    seta: useRef(null),
  };

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      tl.current = criarTimeline(refs);
    });
    return () => ctx.revert();
    // a timeline é criada uma vez; o tempo vem do frame
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useLayoutEffect(() => {
    tl.current?.seek(frame / fps, false);
  }, [frame, fps]);

  const ref = <K extends keyof Refs>(k: K) =>
    refs[k] as React.RefObject<never>;

  return (
    <AbsoluteFill style={{ backgroundColor: "#FFFFFF" }}>
      <svg
        width={1920}
        height={1080}
        viewBox="0 0 1920 1080"
        style={{ position: "absolute", inset: 0 }}
      >
        <defs>
          <mask
            id="estreitar"
            maskUnits="userSpaceOnUse"
            x={-200}
            y={-200}
            width={2400}
            height={1500}
          >
            <g fill="none" stroke="#fff" strokeLinecap="round">
              <path ref={ref("mascaraA")} d={EIXO_FAIXA_A} strokeWidth={LARGURA_TOTAL} />
              <path ref={ref("mascaraB")} d={EIXO_FAIXA_B} strokeWidth={LARGURA_TOTAL} />
            </g>
          </mask>
        </defs>

        {/* fundo amarelo do slide 1, que se estreita até virar a faixa */}
        <rect
          ref={ref("fundoAmarelo")}
          x={-10}
          y={-10}
          width={1940}
          height={1100}
          fill={AMARELO_1}
          mask="url(#estreitar)"
        />
        {/* faixa exata do slide 2 (fica escondida sob o fundo no início) */}
        <path ref={ref("faixa")} d={FAIXA_AMARELA} fill={AMARELO_1} />
      </svg>

      {/* laço branco do slide 1 */}
      <div
        ref={ref("loop")}
        style={{
          position: "absolute",
          inset: 0,
          transformOrigin: "1270px 860px",
          willChange: "transform",
        }}
      >
        <svg width={1920} height={1080} viewBox="0 0 1920 1080">
          <path d={LOOP_BRANCO} fill="#FFFFFF" />
        </svg>
      </div>

      {/* traço preto do slide 1 */}
      <svg
        width={1920}
        height={1080}
        viewBox="0 0 1920 1080"
        style={{ position: "absolute", inset: 0, overflow: "visible" }}
      >
        <path
          ref={ref("traco")}
          d={TRACO_PRETO}
          fill="none"
          stroke="#000"
          strokeWidth={TRACO_PRETO_LARGURA}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {/* textos do slide 1 */}
      <Recorte camada={camadas.s1_selo} innerRef={ref("selo")} />
      <Recorte camada={camadas.s1_vendemos} innerRef={ref("vendemos")} />
      <Recorte camada={camadas.s1_titulo} innerRef={ref("titulo")} />

      {/* textos do slide 2 */}
      <Recorte camada={camadas.s2_linha1} innerRef={ref("linha1")} />
      <Recorte camada={camadas.s2_linha2} innerRef={ref("linha2")} />
      <Recorte camada={camadas.s2_linha3} innerRef={ref("linha3")} />
      <Recorte camada={camadas.s2_linha4} innerRef={ref("linha4")} />
      <Recorte camada={camadas.s2_linha5} innerRef={ref("linha5")} />
      <Recorte camada={camadas.seta} innerRef={ref("seta")} mascarar={false} />

      {/* assinatura: igual nos dois slides, fica parada durante todo o vídeo */}
      <Recorte camada={camadas.logo} />
      <Recorte camada={camadas.rodape} />
    </AbsoluteFill>
  );
};
