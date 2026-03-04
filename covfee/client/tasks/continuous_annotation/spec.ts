import { BaseTaskSpec } from "@covfee-shared/spec/task"
/**
 * @TJS-additionalProperties false
 */
export interface AnnotationDataSpec {
  category: string
  participant: string
  conversation_floor: number[]
  interface: "RankTrace" | "GTrace" | "Binary"
}
export interface MediaSpec {
  type: "video/mp4"
  src: string
}
export interface AudioMediaSpec {
  type: "audio/mp3"
  src: string
}

export interface ContinuousAnnotationTaskSpec extends BaseTaskSpec {
  /**
   * @default "ContinuousAnnotationTask"
   */
  type: "ContinuousAnnotationTask"
  media: MediaSpec[]
  audioMedia: AudioMediaSpec[]
  annotations: AnnotationDataSpec[]
  prolificCompletionCode?: string
  taskVariantPopupBulletPoints?: string[]
  userCanAdd: boolean
  /**
   * When specified: True, means audio on is mandatory, False means audio off (muted) is mandatory.
   * @default null
   */
  audioRequirement?: boolean
  videoTutorialUrl?: string
}
