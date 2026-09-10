import { Box, Button as ButtonChakra, Text, VStack } from "@chakra-ui/react"
import React from "react"

import type { AudioRecorderHandle, RecordingMeta } from "./audio_recorder"
import { Free_text } from "./custom_components/free_text"
import type { GestaltAnnotation } from "./index"
import { SpokenQuestion, type SpokenQuestionAnswer } from "./spoken_question"

/** The two questions form A asks, in the order they are shown. */
export const FORM_A_QUESTIONS = [
  {
    key: "speaker_intention",
    prompt: (
      <>
        What is the intended social action of the (last) speaker? Make your best
        guess if you're uncertain.
      </>
    ),
  },
  {
    key: "response",
    prompt: (
      <>
        What actions could the other side take as a response? Make your best
        guess if you're uncertain.
      </>
    ),
  },
] as const

export type FormAQuestionKey = (typeof FORM_A_QUESTIONS)[number]["key"]

type Props = {
  videoLengthMismatch?: boolean
  gestaltAnnotation?: GestaltAnnotation
  setGestaltAnnotation: (value: GestaltAnnotation) => void
  postFreetextAnswerToServer: () => void
  submitFreeTextToServer: () => void
  noIntentionSeen: boolean
  setNoIntentionSeen: (value: boolean) => void
  getCurrentPausedTime: () => number

  /**
   * When true the two questions are answered by speaking, each with its own
   * recorder, confidence rating and (past the first clip of an item) a
   * changed/unchanged toggle. When false the legacy typed form is shown.
   */
  spokenAnswers?: boolean
  clipNumber?: number
  clipCount?: number
  answers?: Record<string, SpokenQuestionAnswer>
  onAnswerChange?: (key: FormAQuestionKey, value: SpokenQuestionAnswer) => void
  recorderRefs?: Record<string, React.Ref<AudioRecorderHandle>>
  annotationId?: number
  clipIndex?: number
  batchItemId?: number | null
  mediaSrc?: string | null
  savedPlaybackUrls?: Record<string, string | null>
  previousPlaybackUrls?: Record<string, string | null>
  onRecordingSaved?: (meta: RecordingMeta) => void
  onRecordingStateChange?: (key: FormAQuestionKey, recording: boolean) => void
  /** Questions that still have no take, so submit stays disabled. */
  missingRecordings?: FormAQuestionKey[]
}

const Answer_form_A: React.FC<Props> = ({
  videoLengthMismatch,
  gestaltAnnotation,
  setGestaltAnnotation,
  postFreetextAnswerToServer,
  submitFreeTextToServer,
  noIntentionSeen,
  setNoIntentionSeen,
  getCurrentPausedTime,
  spokenAnswers = false,
  clipNumber = 1,
  clipCount,
  answers = {},
  onAnswerChange,
  recorderRefs = {},
  annotationId,
  clipIndex = 0,
  batchItemId,
  mediaSrc,
  savedPlaybackUrls = {},
  previousPlaybackUrls = {},
  onRecordingSaved,
  onRecordingStateChange,
  missingRecordings = [],
}) => {
  /* ---------------- helpers ---------------- */

  // Widened to what Free_text declares; only the two typed fields of the legacy
  // form actually reach it.
  const updateGestaltField = (
    field: string | number | symbol,
    value: string,
  ) => {
    setGestaltAnnotation({ ...gestaltAnnotation, [field]: value })
  }

  /* ---------------- validation ---------------- */

  const isTypedFormComplete = (
    annotation: GestaltAnnotation | undefined,
  ): boolean => {
    if (!annotation) return false

    return Object.entries(annotation).every(([, value]) => {
      if (typeof value === "string") return value.trim().length > 0
      if (typeof value === "number") return Number.isFinite(value)
      return false
    })
  }

  const [submittable, setSubmittable] = React.useState(false)

  React.useEffect(() => {
    setSubmittable(isTypedFormComplete(gestaltAnnotation))
  }, [gestaltAnnotation])

  /**
   * Every question needs a confidence rating and a take, and from the second
   * clip of an item on also a changed/unchanged answer.
   */
  const unansweredQuestions = FORM_A_QUESTIONS.filter(({ key }) => {
    const answer = answers[key]
    if (!answer) return true
    if (answer.confidence === null) return true
    if (clipNumber > 1 && answer.changed === null) return true
    return false
  })

  const spokenBlockers: string[] = []
  if (unansweredQuestions.length > 0) {
    spokenBlockers.push("Answer every question above before continuing.")
  }
  if (missingRecordings.length > 0) {
    spokenBlockers.push(
      missingRecordings.length === FORM_A_QUESTIONS.length
        ? "Record a spoken answer for both questions before continuing."
        : "Record a spoken answer for the remaining question before continuing.",
    )
  }

  const submitDisabled = spokenAnswers
    ? videoLengthMismatch || spokenBlockers.length > 0
    : videoLengthMismatch || (!submittable && !noIntentionSeen)

  /* ---------------- render ---------------- */

  if (spokenAnswers) {
    return (
      <>
        <Box mt="10px">
          <Text fontSize="xl" fontWeight="bold">
            Clip {clipNumber}
            {clipCount ? ` of ${clipCount}` : ""}
          </Text>
          <Text fontSize="sm" color="gray.600">
            {clipNumber === 1
              ? "This is the first and shortest clip of this interaction."
              : `Each clip shows a little more of the same interaction than clip ${
                  clipNumber - 1
                } did.`}
          </Text>
        </Box>

        {FORM_A_QUESTIONS.map(({ key, prompt }) => (
          <SpokenQuestion
            key={key}
            questionKey={key}
            prompt={prompt}
            clipNumber={clipNumber}
            answer={answers[key] ?? { changed: null, confidence: null }}
            onAnswerChange={(value) => onAnswerChange?.(key, value)}
            recorderRef={recorderRefs[key]}
            annotationId={annotationId}
            clipIndex={clipIndex}
            batchItemId={batchItemId}
            mediaSrc={mediaSrc}
            disabled={videoLengthMismatch}
            savedPlaybackUrl={savedPlaybackUrls[key] ?? null}
            previousPlaybackUrl={previousPlaybackUrls[key] ?? null}
            onRecordingSaved={onRecordingSaved}
            onRecordingStateChange={(recording) =>
              onRecordingStateChange?.(key, recording)
            }
          />
        ))}

        <VStack spacing={2} align="stretch" mt="30px">
          <ButtonChakra
            colorScheme="blue"
            onClick={submitFreeTextToServer}
            isDisabled={submitDisabled}
          >
            Submit Annotation
          </ButtonChakra>
          {spokenBlockers.map((blocker) => (
            <Text key={blocker} fontSize="sm" color="gray.600">
              {blocker}
            </Text>
          ))}
        </VStack>
      </>
    )
  }

  return (
    <>
      <Free_text
        gestaltAnnotation={gestaltAnnotation}
        field={"speaker_intention"}
        updateGestaltField={updateGestaltField}
        postFreetextAnswerToServer={postFreetextAnswerToServer}
      >
        What is the intended social action of the (last) speaker? Make your best
        guess if you're uncertain. If you have no updates compared to your
        previous answer, you can reuse the last one.
      </Free_text>
      <Free_text
        gestaltAnnotation={gestaltAnnotation}
        field={"response"}
        updateGestaltField={updateGestaltField}
        postFreetextAnswerToServer={postFreetextAnswerToServer}
      >
        What actions could the other side take as a response? Make your best
        guess if you're uncertain. If you have no updates compared to your
        previous answer, you can reuse the last one.
      </Free_text>

      <VStack spacing={4} align="stretch" mt="40px">
        <ButtonChakra
          mt="10px"
          colorScheme="blue"
          onClick={submitFreeTextToServer}
          isDisabled={submitDisabled}
        >
          Submit Annotation
        </ButtonChakra>
      </VStack>
    </>
  )
}

export { Answer_form_A }
