import { Composition } from "remotion"
import { Hero, HERO_FRAMES } from "./Hero"

export function Root() {
  return <Composition id="Hero" component={Hero} durationInFrames={HERO_FRAMES} fps={30} width={1920} height={1080} />
}
