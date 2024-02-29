import { BasicVideo } from "./media";

export type HTML5PlayerMedia = BasicVideo;

export interface HTML5PlayerOptions {
  /**
   * Uses requestAnimationFrame as trigger for onFrame().
   * requestAnimationFrame normally fires at close to 60Hz
   * Setting to true can improve the quality for lower framerate media by capturing data points between frames.
   * If enabled, data annotations may not align with media frame times.
   * @default false
   */
  useRequestAnimationFrame?: boolean;
  /**
   * If true, a countdown (3-2-1) is shown before the video plays
   */
  countdown?: boolean;
}
