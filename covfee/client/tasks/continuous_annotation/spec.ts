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

/**
 * One clip of the worked example shown before annotation starts, with the
 * answers a good annotator would have given for it.
 * @TJS-additionalProperties false
 */
export interface ExampleClipSpec {
  video: string
  audio?: string
  /** 1-based position in the example's own ladder. */
  clip_number: number
  /** Example answer to "what is the intended social action of the speaker?" */
  speaker_intention: string
  /** Example answer to "what could the other side do in response?" */
  response: string
  speaker_intention_confidence?: number
  response_confidence?: number
  /** Whether the example answer changed from the previous clip. */
  speaker_intention_changed?: boolean
  response_changed?: boolean
  /** Why the example answer moved (or did not) on this clip. */
  note?: string
}

/**
 * A worked example walked through clip by clip. Deliberately built from a video
 * that appears in no HIT, so seeing it cannot prime a real annotation.
 * @TJS-additionalProperties false
 */
export interface ExampleSpec {
  title?: string
  intro?: string
  clips: ExampleClipSpec[]
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
  /**
   * Worked example shown once when the task opens, and reachable afterwards
   * from the "See example" button. Omitted entirely when there is nothing to
   * show, in which case no button appears.
   */
  example?: ExampleSpec
}
