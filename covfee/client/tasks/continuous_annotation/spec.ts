import { BaseTaskSpec } from "@covfee-shared/spec/task"
/**
 * @TJS-additionalProperties false
 */
export interface AnnotationDataSpec {
  category: string
  participant: string
  interface: "RankTrace" | "GTrace" | "Binary"
  conversation_floor?: number[]
  AB_test?: "A" | "B"
  batch_item_id?: number
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
  /**
   * Number of leading batch items that belong to instruction "section one".
   * Items at or past this index get the section-two instructions instead.
   * When omitted, falls back to the legacy 15 (form A) / 30 (form B) split.
   * Set it to the number of items in the task to keep everything in section one.
   */
  sectionOneItemCount?: number
  /**
   * When true, form A shows a microphone record/stop button for every clip and a
   * recording must be captured before the clip can be submitted.
   * @default false
   */
  audioRecordingEnabled?: boolean
}
