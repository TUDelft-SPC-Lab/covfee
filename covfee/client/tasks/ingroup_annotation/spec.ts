import { BaseTaskSpec } from "@covfee-shared/spec/task"
/**
 * @TJS-additionalProperties false
 */
export interface AnnotationDataSpec {
  category: string
  participant: string
  interface: "RankTrace" | "GTrace" | "Binary"
}
export interface MediaSpec {
  type: "video/mp4"
  src: string
}

export interface IngroupAnnotationTaskSpec extends BaseTaskSpec {
  /**
   * @default "IngroupAnnotationTask"
   */
  type: "IngroupAnnotationTask"
  media: MediaSpec[]
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
