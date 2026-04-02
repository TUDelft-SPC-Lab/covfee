import { Button as ButtonChakra, Checkbox, VStack } from "@chakra-ui/react"
import React from "react"

import { Narrative_typeA } from "../annotation_types/narrative_typeA"
import { Free_text } from "./custom_components/free_text"
import type { GestaltAnnotation } from "./index"

type Props = {
  videoLengthMismatch?: boolean
  gestaltAnnotation?: GestaltAnnotation
  setGestaltAnnotation: (value: GestaltAnnotation) => void
  postFreetextAnswerToServer: () => void
  submitFreeTextToServer: () => void
  noIntentionSeen: boolean
  setNoIntentionSeen: (value: boolean) => void
  getCurrentPausedTime: () => number
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
}) => {
  /* ---------------- helpers ---------------- */

  const updateGestaltField = (field: keyof Narrative_typeA, value: string) => {
    setGestaltAnnotation({ ...gestaltAnnotation, [field]: value })
  }

  /* ---------------- validation ---------------- */

  const isformComplete = (
    gestaltAnnotation: GestaltAnnotation | undefined,
  ): boolean => {
    if (!gestaltAnnotation) return false

    return Object.entries(gestaltAnnotation).every(([, value]) => {
      if (typeof value === "string") return value.trim().length > 0
      if (typeof value === "number") return Number.isFinite(value)
      return false
    })
  }

  const [submittable, setSubmittable] = React.useState(false)

  React.useEffect(() => {
    setSubmittable(isformComplete(gestaltAnnotation))
  }, [gestaltAnnotation])

  /* ---------------- render ---------------- */
  return (
    <>
      <Free_text
        gestaltAnnotation={gestaltAnnotation}
        field={"speaker_intention"}
        updateGestaltField={updateGestaltField}
        postFreetextAnswerToServer={postFreetextAnswerToServer}
      >
        What is the intended social action of the (last) speaker? Make your best
        guess if you're uncertain. Also, specify updates, if any, compared to
        your previous answer(s).
      </Free_text>
      <Free_text
        gestaltAnnotation={gestaltAnnotation}
        field={"response"}
        updateGestaltField={updateGestaltField}
        postFreetextAnswerToServer={postFreetextAnswerToServer}
      >
        What actions could the other side take as a response? Make your best
        guess if you're uncertain. Also, specify updates, if any, compared to
        your previous answer(s).
      </Free_text>

      <VStack spacing={4} align="stretch" mt="40px">
        <ButtonChakra
          mt="10px"
          colorScheme="blue"
          onClick={submitFreeTextToServer}
          isDisabled={videoLengthMismatch || (!submittable && !noIntentionSeen)}
        >
          Submit Annotation
        </ButtonChakra>
        <Checkbox
          paddingBottom={"15px"}
          onChange={(e) => setNoIntentionSeen(e.target.checked)}
          isChecked={noIntentionSeen}
        >
          <strong>No Intention:</strong> If you watch the entire clip and see no
          clear intention, you may check the box.{" "}
        </Checkbox>
      </VStack>
    </>
  )
}

export { Answer_form_A }
