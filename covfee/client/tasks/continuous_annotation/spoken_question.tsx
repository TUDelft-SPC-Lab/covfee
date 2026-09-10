import {
  Box,
  HStack,
  Radio,
  RadioGroup,
  Text,
  VStack,
} from "@chakra-ui/react"
import React from "react"

import { AudioRecorder, type AudioRecorderHandle } from "./audio_recorder"
import type { RecordingMeta } from "./audio_recorder"
import { RecordingPlayer } from "./recording_player"

export const CONFIDENCE_LEVELS = [1, 2, 3, 4, 5] as const

export type SpokenQuestionAnswer = {
  /**
   * Whether the annotator's reading changed since the previous clip of this
   * item. Null while unanswered, and left null on the first clip of an item,
   * where there is no previous answer to compare against.
   */
  changed: boolean | null
  /** 1 (no confidence) to 5 (very confident). Null while unanswered. */
  confidence: number | null
}

type Props = {
  questionKey: string
  prompt: React.ReactNode
  /** 1-based position of this clip within its item's ladder. */
  clipNumber: number
  answer: SpokenQuestionAnswer
  onAnswerChange: (answer: SpokenQuestionAnswer) => void

  // Recorder wiring, forwarded as-is.
  recorderRef: React.Ref<AudioRecorderHandle>
  annotationId: number
  clipIndex: number
  batchItemId?: number | null
  mediaSrc?: string | null
  disabled?: boolean
  savedPlaybackUrl?: string | null
  onRecordingSaved?: (meta: RecordingMeta) => void
  onRecordingStateChange?: (isRecording: boolean) => void

  /** The take this annotator gave the same question on the previous clip. */
  previousPlaybackUrl?: string | null
}

/**
 * One of form A's two questions, answered by speaking rather than typing.
 *
 * From the second clip of an item on, the annotator has already answered this
 * same question about an earlier, shorter clip of the same interaction; the
 * "changed" toggle and the previous-take playback exist so that comparison is
 * explicit rather than remembered.
 */
const SpokenQuestion: React.FC<Props> = ({
  questionKey,
  prompt,
  clipNumber,
  answer,
  onAnswerChange,
  recorderRef,
  annotationId,
  clipIndex,
  batchItemId,
  mediaSrc,
  disabled,
  savedPlaybackUrl,
  onRecordingSaved,
  onRecordingStateChange,
  previousPlaybackUrl,
}) => {
  // Nothing to have changed from on the first clip of an item.
  const showChangedQuestion = clipNumber > 1

  return (
    <Box
      mt="28px"
      p="16px"
      borderWidth="1px"
      borderColor="gray.200"
      borderRadius="md"
    >
      <Text fontSize="lg" fontWeight="semibold">
        {prompt}
      </Text>

      <VStack spacing={4} align="stretch" mt="14px">
        {showChangedQuestion && (
          <Box>
            <Text fontSize="md">
              Has your interpretation changed from your previous answer?
            </Text>
            <RadioGroup
              mt="6px"
              value={
                answer.changed === null ? "" : answer.changed ? "yes" : "no"
              }
              onChange={(value) =>
                onAnswerChange({ ...answer, changed: value === "yes" })
              }
            >
              <HStack spacing={6}>
                <Radio value="yes" isDisabled={disabled}>
                  Yes
                </Radio>
                <Radio value="no" isDisabled={disabled}>
                  No
                </Radio>
              </HStack>
            </RadioGroup>
          </Box>
        )}

        <Box>
          <Text fontSize="md">
            How confident are you about your current perception?
          </Text>
          <RadioGroup
            mt="6px"
            value={answer.confidence === null ? "" : String(answer.confidence)}
            onChange={(value) =>
              onAnswerChange({ ...answer, confidence: Number(value) })
            }
          >
            <HStack spacing={6}>
              {CONFIDENCE_LEVELS.map((level) => (
                <Radio key={level} value={String(level)} isDisabled={disabled}>
                  {level}
                </Radio>
              ))}
            </HStack>
          </RadioGroup>
          <Text fontSize="xs" color="gray.600" mt="4px">
            1 = no confidence, 5 = very confident
          </Text>
        </Box>

        <Box>
          <Text fontSize="md">
            Record your current interpretation and your reasoning.
          </Text>
          <AudioRecorder
            ref={recorderRef}
            annotationId={annotationId}
            clipIndex={clipIndex}
            clipNumber={clipNumber}
            questionKey={questionKey}
            batchItemId={batchItemId}
            mediaSrc={mediaSrc}
            disabled={disabled}
            savedPlaybackUrl={savedPlaybackUrl}
            onRecordingSaved={onRecordingSaved}
            onRecordingStateChange={onRecordingStateChange}
          />
        </Box>

        {showChangedQuestion && (
          <HStack spacing={3}>
            <Text fontSize="sm" color="gray.700">
              Your answer for clip {clipNumber - 1}:
            </Text>
            <RecordingPlayer
              src={previousPlaybackUrl ?? null}
              label={
                previousPlaybackUrl
                  ? "▶ Play previous answer"
                  : "No previous answer"
              }
            />
          </HStack>
        )}
      </VStack>
    </Box>
  )
}

export { SpokenQuestion }
