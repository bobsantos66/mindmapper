import { Composition } from "remotion";
import { Showreel } from "./Showreel";

export const RemotionRoot: React.FC = () => (
  <Composition id="Showreel" component={Showreel} durationInFrames={360} fps={60} width={1920} height={1080} />
);
