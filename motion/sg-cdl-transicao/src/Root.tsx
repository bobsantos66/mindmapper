import { Composition } from "remotion";
import { TransicaoCDL } from "./TransicaoCDL";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="TransicaoCDL"
      component={TransicaoCDL}
      durationInFrames={165}
      fps={30}
      width={1920}
      height={1080}
    />
  );
};
