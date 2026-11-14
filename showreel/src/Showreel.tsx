// SG PROPAG showreel: 6 s, 1920x1080 @ 60 fps. Ends exactly on public/mot-final.webp.
// Every layer is one of the supplied full-frame transparent assets; motion is a pure function of frame.
import React from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Audio } from "@remotion/media";
import { CameraMotionBlur } from "@remotion/motion-blur";

const W = 1920;
const H = 1080;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// ---------------------------------------------------------------- final layout (measured on mot-final.webp)
// each layer is full frame; [scale, tx, ty] maps its artwork onto the final cover.
const FINAL = {
  logo: [0.2622, 148.6, 104.6],
  pill: [0.43897, 101.5, 66.8],
  head: [0.578, 88.9, 256.4],
} as const;

// timeline (frames @ 60 fps)
export const T = {
  logoIn: -6,
  sliceOut: 46,
  headIn: 54,
  diveStart: 116,
  dive: 146,
  pillMorph: 150,
  pillText: 160,
  pillHome: 188,
  sail: 192,
  logoHome: 212,
  headHome: 224,
  finalFade: 274,
  end: 360,
};

const sp = (frame: number, fps: number, start: number, config = {}) =>
  spring({ frame: frame - start, fps, config: { damping: 15, stiffness: 170, ...config } });

// A full-frame layer, optionally clipped to a polygon of the artwork, with a transform.
const Layer: React.FC<{
  src: string;
  clip?: string;
  transform?: string;
  innerTransform?: string;
  opacity?: number;
  origin?: string;
}> = ({ src, clip, transform, innerTransform, opacity = 1, origin = "0 0" }) => (
  <AbsoluteFill style={{ transform, transformOrigin: origin, opacity }}>
    {/* fixed window */}
    <AbsoluteFill style={{ clipPath: clip }}>
      {/* the moving piece is pre-clipped to its own region, so nothing else slides into the window */}
      <AbsoluteFill style={{ transform: innerTransform }}>
        <AbsoluteFill style={{ clipPath: clip }}>
          <Img src={staticFile(src)} style={{ width: W, height: H, position: "absolute" }} />
        </AbsoluteFill>
      </AbsoluteFill>
    </AbsoluteFill>
  </AbsoluteFill>
);

const rect = (x0: number, y0: number, x1: number, y1: number) =>
  `polygon(${x0}px ${y0}px, ${x1}px ${y0}px, ${x1}px ${y1}px, ${x0}px ${y1}px)`;
const poly = (pts: number[][]) => `polygon(${pts.map(([x, y]) => `${x}px ${y}px`).join(",")})`;
const fit = ([s, tx, ty]: readonly number[]) => `translate(${tx}px, ${ty}px) scale(${s})`;

// ---------------------------------------------------------------- LOGO: SG monogram slams, letters rise
const LETTERS = [
  rect(664, 410, 802, 632),
  rect(804, 410, 941, 632),
  rect(941, 410, 1138, 632),
  poly([[1142, 410], [1306, 410], [1236, 632], [1142, 632]]),
  poly([[1236, 632], [1306, 410], [1340, 410], [1412, 632]]),
  poly([[1340, 410], [1566, 410], [1566, 632], [1412, 632]]),
];
const Logo: React.FC<{ start: number; base?: string; big?: number }> = ({ start, base = "", big = 3.4 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const k = sp(frame, fps, start, { damping: 13, stiffness: 190 });
  if (frame < start) return null;
  const s = Math.exp(Math.log(big) * (1 - k)); // log-space zoom: constant-rate dolly feel
  return (
    <AbsoluteFill style={{ transform: base, transformOrigin: "0 0" }}>
      <Layer
        src="logo.png"
        clip={rect(350, 410, 650, 632)}
        origin="500px 520px"
        transform={`scale(${s}) rotate(${(1 - k) * -14}deg)`}
      />
      {LETTERS.map((c, i) => {
        const kk = sp(frame, fps, start + 8 + i * 3.5, { damping: 14, stiffness: 210 });
        return (
          <Layer
            key={i}
            src="logo.png"
            clip={c}
            innerTransform={`translateY(${(1 - kk) * 240}px)`}
          />
        );
      })}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- HEADLINE: words rise out of line masks
const WORDS = [
  { clip: rect(220, 318, 770, 528), d: 0 },
  { clip: rect(790, 318, 1660, 528), d: 8 },
  { clip: rect(220, 528, 352, 752), d: 20 },
  { clip: rect(380, 528, 918, 752), d: 26 },
  { clip: rect(940, 528, 1066, 752), d: 34 },
  { clip: rect(1084, 528, 1500, 752), d: 40 },
  { clip: rect(1500, 528, 1600, 752), d: 46, q: true }, // the question mark
];
const Headline: React.FC<{ start: number; base?: string; stagger?: number }> = ({ start, base = "", stagger = 1 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (frame < start) return null;
  return (
    <AbsoluteFill style={{ transform: base, transformOrigin: "0 0" }}>
      {WORDS.map((w, i) => {
        const k = sp(frame, fps, start + w.d * stagger, { damping: 16, stiffness: 220 });
        const punch = w.q ? sp(frame, fps, start + w.d * stagger, { damping: 7, stiffness: 260 }) : k;
        return (
          <Layer
            key={i}
            src="headline.png"
            clip={w.clip}
            innerTransform={
              w.q
                ? `translateY(${(1 - k) * 230}px) scale(${0.4 + 0.6 * punch})`
                : `translateY(${(1 - k) * 230}px)`
            }
          />
        );
      })}
    </AbsoluteFill>
  );
};

// Horizontal slice whip: the scene is cut into bands that shoot out alternately left and right.
const SliceOut: React.FC<{ start: number; children: React.ReactNode }> = ({ start, children }) => {
  const frame = useCurrentFrame();
  if (frame < start) return <>{children}</>;
  const N = 9;
  return (
    <>
      {Array.from({ length: N }).map((_, i) => {
        const p = interpolate(frame, [start + i * 0.8, start + 10 + i * 0.8], [0, 1], {
          ...clamp,
          easing: Easing.in(Easing.exp),
        });
        const y0 = (H / N) * i;
        return (
          <AbsoluteFill
            key={i}
            style={{ clipPath: rect(0, y0, W, y0 + H / N + 1), transform: `translateX(${(i % 2 ? 1 : -1) * p * 2300}px)` }}
          >
            {children}
          </AbsoluteFill>
        );
      })}
    </>
  );
};

// ---------------------------------------------------------------- the film
const DOT = [1539, 676];
const PILL_SRC = { x: 270, y: 488, w: 1402, h: 105, r: 22 };

const Film: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Act 2 camera: start tight on "Quem", dolly out (log space), then dive into the dot of "?"
  const pull = interpolate(frame, [T.headIn, T.headIn + 56], [0, 1], { ...clamp, easing: Easing.bezier(0.2, 0.7, 0.2, 1) });
  const zOut = Math.exp(Math.log(2.4) * (1 - pull));
  const dive = interpolate(frame, [T.diveStart, T.dive], [0, 1], { ...clamp, easing: Easing.bezier(0.6, 0, 0.9, 0.4) });
  const zIn = Math.exp(Math.log(300) * dive);
  const focus = [
    interpolate(pull, [0, 1], [470, W / 2]) * (1 - Math.min(1, dive * 3)) + DOT[0] * Math.min(1, dive * 3),
    interpolate(pull, [0, 1], [420, H / 2]) * (1 - Math.min(1, dive * 3)) + DOT[1] * Math.min(1, dive * 3),
  ];
  const cam = `translate(${W / 2}px, ${H / 2}px) scale(${zOut * zIn}) translate(${-focus[0]}px, ${-focus[1]}px)`;

  // Act 3 pill: the black of the dot becomes the pill
  const m = sp(frame, fps, T.pillMorph, { damping: 18, stiffness: 160 });
  const home = sp(frame, fps, T.pillHome, { damping: 17, stiffness: 150 });
  const [ps, ptx, pty] = FINAL.pill;
  const pillGroup = `translate(${ptx * home}px, ${pty * home}px) scale(${1 + (ps - 1) * home})`;
  const bx = interpolate(m, [0, 1], [0, PILL_SRC.x]);
  const by = interpolate(m, [0, 1], [0, PILL_SRC.y]);
  const bw = interpolate(m, [0, 1], [W, PILL_SRC.w]);
  const bh = interpolate(m, [0, 1], [H, PILL_SRC.h]);
  const textWipe = interpolate(frame, [T.pillText, T.pillText + 18], [100, 0], { ...clamp, easing: Easing.bezier(0.16, 1, 0.3, 1) });

  // Act 4 sail: swings in on Y in perspective and settles
  const sk = sp(frame, fps, T.sail, { damping: 13, stiffness: 120 });

  return (
    <AbsoluteFill style={{ backgroundColor: "white" }}>
      {/* Act 2: headline under a moving camera */}
      {frame >= T.headIn - 8 && frame < T.dive + 2 && (
        <AbsoluteFill style={{ transform: cam, transformOrigin: "0 0" }}>
          <Headline start={T.headIn} />
        </AbsoluteFill>
      )}

      {/* Act 1: logo */}
      {frame < T.sliceOut + 16 && (
        <SliceOut start={T.sliceOut}>
          <AbsoluteFill style={{ backgroundColor: "white" }}>
            <Logo start={T.logoIn} />
          </AbsoluteFill>
        </SliceOut>
      )}

      {/* Act 4: sail (behind the pill) */}
      {frame >= T.sail && frame < T.finalFade + 20 && (
        <AbsoluteFill style={{ perspective: 1800, perspectiveOrigin: "1400px 520px" }}>
          <Layer
            src="sail.webp"
            origin="1400px 560px"
            opacity={Math.min(1, sk * 4)}
            transform={`translateY(${(1 - sk) * 140}px) rotateY(${(1 - sk) * 78}deg) rotateZ(${(1 - sk) * -8}deg)`}
          />
        </AbsoluteFill>
      )}

      {/* Act 3: pill */}
      {frame >= T.dive && frame < T.finalFade + 20 && (
        <AbsoluteFill style={{ transform: pillGroup, transformOrigin: "0 0" }}>
          <div
            style={{
              position: "absolute",
              left: bx,
              top: by,
              width: bw,
              height: bh,
              borderRadius: interpolate(m, [0, 1], [0, PILL_SRC.r]),
              backgroundColor: "black",
            }}
          />
          {frame >= T.pillText && <Layer src="pill.png" clip={`inset(0 ${textWipe}% 0 0)`} />}
        </AbsoluteFill>
      )}

      {/* Act 5: assembly on the final layout */}
      {frame < T.finalFade + 20 && (
        <>
          <Logo start={T.logoHome} base={fit(FINAL.logo)} big={2.2} />
          <Headline start={T.headHome} base={fit(FINAL.head)} stagger={0.55} />
        </>
      )}

      {/* the delivered frame: MOT FINAL */}
      <Img
        src={staticFile("mot-final.webp")}
        style={{
          position: "absolute",
          width: W,
          height: H,
          opacity: interpolate(frame, [T.finalFade, T.finalFade + 16], [0, 1], clamp),
        }}
      />
    </AbsoluteFill>
  );
};

export const Showreel: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "white" }}>
    <Sequence durationInFrames={T.finalFade + 20} layout="absolute-fill">
      <CameraMotionBlur shutterAngle={200} samples={8}>
        <Film />
      </CameraMotionBlur>
    </Sequence>
    <Sequence from={T.finalFade + 20} layout="absolute-fill">
      <Img src={staticFile("mot-final.webp")} style={{ width: W, height: H }} />
    </Sequence>
    <Audio src={staticFile("mix.wav")} />
  </AbsoluteFill>
);
