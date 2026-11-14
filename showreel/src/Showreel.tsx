// SG PROPAG showreel: 6 s @ 60 fps, authored in 1920x1080 layer coordinates and rendered at any scale
// (Showreel = 1080p, Showreel4K = 2160p). Type and logo are vectors (sharp at every zoom); the 3-D sail is
// the supplied render upscaled 2x. It ends on the MOT FINAL layout. Motion is a pure function of frame.
import React from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  Sequence,
  continueRender,
  delayRender,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Audio } from "@remotion/media";
import { CameraMotionBlur } from "@remotion/motion-blur";
import { LOGO_D, LOGO_FILL } from "./logoPath";

// Roboto, the cover's face, from public/ (no font library needed)
const FONT = "Roboto";
const fontsReady = delayRender("Loading Roboto");
Promise.all(
  [["400", "roboto-400.woff2"], ["700", "roboto-700.woff2"]].map(async ([weight, file]) => {
    const face = new FontFace(FONT, `url(${staticFile(file)}) format("woff2")`, { weight });
    await face.load();
    document.fonts.add(face);
  }),
).then(() => continueRender(fontsReady));

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
  ballLand: 52,
  sliceOut: 86,
  headIn: 94,
  diveStart: 146,
  dive: 170,
  pillMorph: 174,
  pillText: 182,
  pillHome: 204,
  sail: 206,
  logoHome: 220,
  headHome: 230,
  finalFade: 280,
  end: 360,
};

const sp = (frame: number, fps: number, start: number, config = {}) =>
  spring({ frame: frame - start, fps, config: { damping: 15, stiffness: 170, ...config } });

// A full-frame layer, optionally clipped to a polygon of the artwork, with a transform.
const Layer: React.FC<{
  src?: string;
  children?: React.ReactNode;
  clip?: string;
  transform?: string;
  innerTransform?: string;
  opacity?: number;
  origin?: string;
}> = ({ src, children, clip, transform, innerTransform, opacity = 1, origin = "0 0" }) => (
  <AbsoluteFill style={{ transform, transformOrigin: origin, opacity }}>
    {/* fixed window */}
    <AbsoluteFill style={{ clipPath: clip }}>
      {/* the moving piece is pre-clipped to its own region, so nothing else slides into the window */}
      <AbsoluteFill style={{ transform: innerTransform, transformOrigin: "0 0" }}>
        <AbsoluteFill style={{ clipPath: clip }}>
          {children ?? <Img src={staticFile(src!)} style={{ width: W, height: H, position: "absolute" }} />}
        </AbsoluteFill>
      </AbsoluteFill>
    </AbsoluteFill>
  </AbsoluteFill>
);

const rect = (x0: number, y0: number, x1: number, y1: number) =>
  `polygon(${x0}px ${y0}px, ${x1}px ${y0}px, ${x1}px ${y1}px, ${x0}px ${y1}px)`;
const poly = (pts: number[][]) => `polygon(${pts.map(([x, y]) => `${x}px ${y}px`).join(",")})`;
const fit = ([s, tx, ty]: readonly number[]) => `translate(${tx}px, ${ty}px) scale(${s})`;

// full-frame inline SVG in layer coordinates: vector, so it stays sharp under any camera zoom
const Svg: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", overflow: "visible" }}>
    {children}
  </svg>
);
const LogoArt = () => (
  <Svg>
    <path d={LOGO_D} fill={LOGO_FILL} fillRule="evenodd" />
  </Svg>
);

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
        clip={rect(350, 410, 650, 632)}
        origin="500px 520px"
        transform={`scale(${s}) rotate(${(1 - k) * -14}deg)`}
      >
        <LogoArt />
      </Layer>
      {LETTERS.map((c, i) => {
        const kk = sp(frame, fps, start + 8 + i * 3.5, { damping: 14, stiffness: 210 });
        return (
          <Layer key={i} clip={c} innerTransform={`translateY(${(1 - kk) * 240}px)`}>
            <LogoArt />
          </Layer>
        );
      })}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- LOGO INTRO: a black ball ricochets off the
// frame edges on a fixed (non-random) path, lands on the monogram and bursts open into the logo.
const BALL_R = 58;
// waypoints: entry, bottom edge, top edge, right edge, landing on the SG monogram
const BALL_PATH = [
  [-40, 230],
  [700, H - BALL_R],
  [1300, BALL_R],
  [W - BALL_R, 470],
  [500, 520],
];
const BOUNCE_AXIS = ["y", "y", "x"]; // which axis each bounce squashes along
const SPEED = 79; // px per frame on the ricochet legs
const legLen = BALL_PATH.slice(1).map((p, i) => Math.hypot(p[0] - BALL_PATH[i][0], p[1] - BALL_PATH[i][1]));
const legStart = [0];
for (let i = 0; i < 3; i++) legStart.push(legStart[i] + legLen[i] / SPEED);
// legStart = [0, f(bottom), f(top), f(right)]; the last leg decelerates into the landing
export const BOUNCES = legStart.slice(1);

const ballAt = (f: number): [number, number] => {
  for (let i = 0; i < 3; i++) {
    if (f < legStart[i + 1]) {
      const p = (f - legStart[i]) / (legStart[i + 1] - legStart[i]);
      const a = BALL_PATH[i], b = BALL_PATH[i + 1];
      return [a[0] + (b[0] - a[0]) * p, a[1] + (b[1] - a[1]) * p];
    }
  }
  const p = interpolate(f, [legStart[3], T.ballLand], [0, 1], { ...clamp, easing: Easing.bezier(0.3, 0.75, 0.4, 1) });
  const a = BALL_PATH[3], b = BALL_PATH[4];
  return [a[0] + (b[0] - a[0]) * p, a[1] + (b[1] - a[1]) * p];
};

const BallLogo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const [x, y] = ballAt(frame);
  // squash on each wall hit, along the hit axis (pure function of distance to the hit frame)
  let sx = 1, sy = 1;
  BOUNCES.forEach((b, i) => {
    const q = 0.42 * Math.max(0, 1 - Math.abs(frame - b) / 3.5);
    if (BOUNCE_AXIS[i] === "y") { sy -= q; sx += q * 0.5; } else { sx -= q; sy += q * 0.5; }
  });
  const land = frame - T.ballLand;
  const squash = land >= 0 ? 0.3 * Math.max(0, 1 - land / 4) : 0;
  sx -= squash; sy += squash * 0.6;
  // the burst: a circle opens from the ball and uncovers the monogram
  const open = interpolate(frame, [T.ballLand + 2, T.ballLand + 16], [BALL_R, 260], { ...clamp, easing: Easing.out(Easing.exp) });
  const ballGone = interpolate(frame, [T.ballLand + 2, T.ballLand + 9], [1, 0], clamp);
  return (
    <AbsoluteFill>
      {frame >= T.ballLand + 2 && (
        <AbsoluteFill style={{ clipPath: `circle(${open}px at 500px 520px)` }}>
          <Layer clip={rect(350, 410, 650, 632)}>
            <LogoArt />
          </Layer>
        </AbsoluteFill>
      )}
      {LETTERS.map((c, i) => {
        const kk = sp(frame, fps, T.ballLand + 4 + i * 2.6, { damping: 14, stiffness: 210 });
        if (kk <= 0) return null;
        return (
          <Layer key={i} clip={c} innerTransform={`translateY(${(1 - kk) * 240}px)`}>
            <LogoArt />
          </Layer>
        );
      })}
      {ballGone > 0 && (
        <div
          style={{
            position: "absolute",
            left: x - BALL_R,
            top: y - BALL_R,
            width: BALL_R * 2,
            height: BALL_R * 2,
            borderRadius: "50%",
            backgroundColor: "#111",
            opacity: ballGone,
            scale: `${sx * (1 + (open - BALL_R) / BALL_R * 0.25)} ${sy * (1 + (open - BALL_R) / BALL_R * 0.25)}`,
          }}
        />
      )}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- HEADLINE: words rise out of line masks
const HEAD = { size: 210.91, track1: -8.39, track2: -7.98, base1: 481.96, base2: 698 };
const LINE1 = rect(0, 300, W, 530);
const LINE2 = rect(0, 530, W, 770);
const WORDS = [
  { text: "Quem", x: 226.6, line: 1, d: 0 },
  { text: "convence", x: 797.4, line: 1, d: 8 },
  { text: "o", x: 226.7, line: 2, d: 20 },
  { text: "lojista", x: 382.5, line: 2, d: 26 },
  { text: "a", x: 949.8, line: 2, d: 34 },
  { text: "ficar", x: 1099.5, line: 2, d: 40 },
  { text: "?", x: 1487.9, line: 2, d: 46, q: true },
];
const Word: React.FC<{ w: (typeof WORDS)[number] }> = ({ w }) => (
  <Svg>
    <text
      x={w.x}
      y={w.line === 1 ? HEAD.base1 : HEAD.base2}
      fontFamily={FONT}
      fontWeight={700}
      fontSize={HEAD.size}
      letterSpacing={w.line === 1 ? HEAD.track1 : HEAD.track2}
      fill="#000"
    >
      {w.text}
    </text>
  </Svg>
);
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
            clip={w.line === 1 ? LINE1 : LINE2}
            innerTransform={
              w.q
                ? `translateY(${(1 - k) * 230}px) translate(1532px, 620px) scale(${0.4 + 0.6 * punch}) translate(-1532px, -620px)`
                : `translateY(${(1 - k) * 230}px)`
            }
          >
            <Word w={w} />
          </Layer>
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
const DOT_R = 18;
const PILL_SRC = { x: 270, y: 488, w: 1402, h: 105, r: 22 };

const Film: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Act 2 camera: start tight on "Quem", dolly out (log space), then dive into the dot of "?"
  const pull = interpolate(frame, [T.headIn, T.headIn + 44], [0, 1], { ...clamp, easing: Easing.bezier(0.2, 0.7, 0.2, 1) });
  const zOut = Math.exp(Math.log(2.4) * (1 - pull));
  const dive = interpolate(frame, [T.diveStart, T.dive], [0, 1], { ...clamp, easing: Easing.bezier(0.6, 0, 0.9, 0.4) });
  const zIn = Math.exp(Math.log(300) * dive);
  const focus = [
    interpolate(pull, [0, 1], [470, W / 2]) * (1 - Math.min(1, dive * 3)) + DOT[0] * Math.min(1, dive * 3),
    interpolate(pull, [0, 1], [420, H / 2]) * (1 - Math.min(1, dive * 3)) + DOT[1] * Math.min(1, dive * 3),
  ];
  const zoom = zOut * zIn;
  const cam = `translate(${W / 2}px, ${H / 2}px) scale(${zoom}) translate(${-focus[0]}px, ${-focus[1]}px)`;
  // during the dive the dot of "?" is drawn as a screen-space disc: exact at any zoom, no tiling
  const dotScreen = [W / 2 + (DOT[0] - focus[0]) * zoom, H / 2 + (DOT[1] - focus[1]) * zoom];
  const dotR = DOT_R * zoom;

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
        <>
          {zIn < 12 && (
            <AbsoluteFill style={{ transform: cam, transformOrigin: "0 0" }}>
              <Headline start={T.headIn} stagger={0.8} />
            </AbsoluteFill>
          )}
          {zIn > 1.5 && (
            <div
              style={{
                position: "absolute",
                left: dotScreen[0] - dotR,
                top: dotScreen[1] - dotR,
                width: dotR * 2,
                height: dotR * 2,
                borderRadius: "50%",
                backgroundColor: "#000",
              }}
            />
          )}
        </>
      )}

      {/* Act 1: logo */}
      {frame < T.sliceOut + 16 && (
        <SliceOut start={T.sliceOut}>
          <AbsoluteFill style={{ backgroundColor: "white" }}>
            <BallLogo />
          </AbsoluteFill>
        </SliceOut>
      )}

      {/* Act 4: sail (behind the pill) */}
      {frame >= T.sail && (
        <AbsoluteFill style={{ perspective: 1800, perspectiveOrigin: "1400px 520px" }}>
          <Layer
            src="sail-2x.webp"
            origin="1400px 560px"
            opacity={Math.min(1, sk * 4)}
            transform={`translateY(${(1 - sk) * 140}px) rotateY(${(1 - sk) * 78}deg) rotateZ(${(1 - sk) * -8}deg)`}
          />
        </AbsoluteFill>
      )}

      {/* Act 3: pill */}
      {frame >= T.dive && (
        <AbsoluteFill style={{ transform: pillGroup, transformOrigin: "0 0" }}>
          <div
            style={{
              position: "absolute",
              left: bx,
              top: by,
              width: bw,
              height: bh,
              borderRadius: interpolate(m, [0, 1], [0, PILL_SRC.r]) + home * (PILL_SRC.h / 2 - PILL_SRC.r), // fully round once it lands, like the cover
              backgroundColor: "black",
            }}
          />
          {frame >= T.pillText && (
            <Layer clip={`inset(0 ${textWipe}% 0 0)`}>
              <Svg>
                <text x={330.14} y={563.18} fontFamily={FONT} fontWeight={400} fontSize={85.57} letterSpacing={-3.52} fill="#fff">
                  Análise competitiva de comunicação
                </text>
              </Svg>
            </Layer>
          )}
        </AbsoluteFill>
      )}

      {/* Act 5: assembly on the final layout */}
      {(
        <>
          <Logo start={T.logoHome} base={fit(FINAL.logo)} big={2.2} />
          <Headline start={T.headHome} base={fit(FINAL.head)} stagger={0.55} />
        </>
      )}

    </AbsoluteFill>
  );
};

// Everything is authored on a 1920x1080 stage and scaled up as vectors at render time.
export const Showreel: React.FC<{ scale: number }> = ({ scale }) => (
  <AbsoluteFill style={{ backgroundColor: "white" }}>
    <AbsoluteFill style={{ width: W, height: H, transform: `scale(${scale})`, transformOrigin: "0 0" }}>
      <Sequence durationInFrames={T.finalFade} layout="absolute-fill">
        <CameraMotionBlur shutterAngle={200} samples={8}>
          <Film />
        </CameraMotionBlur>
      </Sequence>
      {/* the settled MOT FINAL layout: no motion left, so no blur samples needed */}
      <Sequence from={T.finalFade} layout="absolute-fill">
        <Sequence from={-T.finalFade} layout="absolute-fill">
          <Film />
        </Sequence>
      </Sequence>
    </AbsoluteFill>
    <Audio src={staticFile("mix.wav")} />
  </AbsoluteFill>
);
