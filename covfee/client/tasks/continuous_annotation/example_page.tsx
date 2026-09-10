import {
  Badge,
  Box,
  Button as ButtonChakra,
  Divider,
  HStack,
  Modal as ChakraModal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  VStack,
} from "@chakra-ui/react"
import React, { useEffect, useRef, useState } from "react"

import { FORM_A_QUESTIONS } from "./answer_form_A"
import type { ExampleClipSpec, ExampleSpec } from "./spec"

type Props = {
  example: ExampleSpec
  isOpen: boolean
  onClose: () => void
}

const confidenceLabel = (value?: number) =>
  value === undefined || value === null ? "—" : `${value} / 5`

/** The example's answer to one question, laid out like the real form. */
const ExampleAnswer: React.FC<{
  prompt: React.ReactNode
  answer: string
  confidence?: number
  changed?: boolean
  showChanged: boolean
}> = ({ prompt, answer, confidence, changed, showChanged }) => (
  <Box
    p="14px"
    borderWidth="1px"
    borderColor="gray.200"
    borderRadius="md"
    mt="12px"
  >
    <Text fontWeight="semibold">{prompt}</Text>

    {showChanged && (
      <HStack mt="8px" spacing={2}>
        <Text fontSize="sm" color="gray.700">
          Interpretation changed?
        </Text>
        <Badge colorScheme={changed ? "orange" : "gray"}>
          {changed === undefined ? "—" : changed ? "Yes" : "No"}
        </Badge>
      </HStack>
    )}

    <HStack mt="6px" spacing={2}>
      <Text fontSize="sm" color="gray.700">
        Confidence
      </Text>
      <Badge colorScheme="blue">{confidenceLabel(confidence)}</Badge>
    </HStack>

    <Box
      mt="8px"
      p="10px"
      bg="gray.50"
      borderRadius="md"
      borderLeftWidth="3px"
      borderLeftColor="blue.400"
    >
      <Text fontSize="xs" color="gray.600" mb="4px">
        What you would say out loud:
      </Text>
      <Text fontSize="sm" fontStyle="italic">
        “{answer}”
      </Text>
    </Box>
  </Box>
)

const ExampleClip: React.FC<{ clip: ExampleClipSpec; total: number }> = ({
  clip,
  total,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null)

  // Reload when the clip changes: the <video> keeps the old buffer otherwise.
  useEffect(() => {
    videoRef.current?.load()
  }, [clip.video])

  const showChanged = clip.clip_number > 1

  return (
    <Box>
      <HStack spacing={3}>
        <Text fontSize="lg" fontWeight="bold">
          Clip {clip.clip_number} of {total}
        </Text>
        {!showChanged && (
          <Badge colorScheme="green">first clip — nothing to compare yet</Badge>
        )}
      </HStack>

      <Box mt="10px" borderRadius="md" overflow="hidden" bg="black">
        <video
          ref={videoRef}
          controls
          style={{ width: "100%", maxHeight: "45vh" }}
        >
          <source src={clip.video} type="video/mp4" />
        </video>
      </Box>

      {clip.audio && (
        <Box mt="8px">
          <audio controls style={{ width: "100%" }} src={clip.audio} />
        </Box>
      )}

      {clip.note && (
        <Text mt="10px" fontSize="sm" color="gray.700">
          {clip.note}
        </Text>
      )}

      <ExampleAnswer
        prompt={FORM_A_QUESTIONS[0].prompt}
        answer={clip.speaker_intention}
        confidence={clip.speaker_intention_confidence}
        changed={clip.speaker_intention_changed}
        showChanged={showChanged}
      />
      <ExampleAnswer
        prompt={FORM_A_QUESTIONS[1].prompt}
        answer={clip.response}
        confidence={clip.response_confidence}
        changed={clip.response_changed}
        showChanged={showChanged}
      />
    </Box>
  )
}

/**
 * Worked example, walked one clip at a time so the annotator sees the thing the
 * task actually asks of them: that each clip extends the last, and that the
 * answer is allowed to move as more of the interaction becomes visible.
 */
const ExamplePage: React.FC<Props> = ({ example, isOpen, onClose }) => {
  const [index, setIndex] = useState(0)
  const clips = example.clips ?? []

  // Reopening starts from the top rather than wherever it was left.
  useEffect(() => {
    if (isOpen) setIndex(0)
  }, [isOpen])

  if (clips.length === 0) return null

  const clip = clips[Math.min(index, clips.length - 1)]
  const isLast = index >= clips.length - 1

  return (
    <ChakraModal isOpen={isOpen} onClose={onClose} size="3xl" scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{example.title ?? "Example annotation"}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          {example.intro && (
            <>
              <Text fontSize="sm" color="gray.700">
                {example.intro}
              </Text>
              <Divider my="12px" />
            </>
          )}
          <ExampleClip clip={clip} total={clips.length} />
        </ModalBody>
        <ModalFooter>
          <VStack align="stretch" spacing={2} w="100%">
            <HStack justify="space-between">
              <ButtonChakra
                variant="outline"
                onClick={() => setIndex((i) => Math.max(0, i - 1))}
                isDisabled={index === 0}
              >
                ← Previous clip
              </ButtonChakra>
              <Text fontSize="sm" color="gray.600">
                {index + 1} / {clips.length}
              </Text>
              {isLast ? (
                <ButtonChakra colorScheme="blue" onClick={onClose}>
                  Start annotating
                </ButtonChakra>
              ) : (
                <ButtonChakra
                  colorScheme="blue"
                  onClick={() =>
                    setIndex((i) => Math.min(clips.length - 1, i + 1))
                  }
                >
                  Next clip →
                </ButtonChakra>
              )}
            </HStack>
          </VStack>
        </ModalFooter>
      </ModalContent>
    </ChakraModal>
  )
}

export { ExamplePage }
