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
  /**
   * 1-based position of this clip within its batch item's clip ladder, and the
   * length of that ladder. Shown to the annotator ("Clip 3 of 10") and used to
   * decide whether the "has your interpretation changed" question applies, which
   * it does not for the first clip of an item.
   */
  clip_number?: number
  clip_count?: number
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
   * When true, form A answers each of its two questions with a spoken recording
   * instead of typed text: per question a record/stop button, a confidence
   * rating, and (from the second clip of an item on) whether the interpretation
   * changed. Both recordings must be captured before the clip can be submitted.
   * @default false
   */
  audioRecordingEnabled?: boolean
}
