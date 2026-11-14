import { Composition } from "remotion";
import { Showreel } from "./Showreel";

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="Showreel" component={Showreel} defaultProps={{ scale: 1 }} durationInFrames={360} fps={60} width={1920} height={1080} />
    <Composition id="Showreel2K" component={Showreel} defaultProps={{ scale: 2560 / 1920 }} durationInFrames={360} fps={60} width={2560} height={1440} />
    <Composition id="Showreel4K" component={Showreel} defaultProps={{ scale: 2 }} durationInFrames={360} fps={60} width={3840} height={2160} />
  </>
);
