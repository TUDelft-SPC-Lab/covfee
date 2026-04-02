import { Box, Text, Textarea } from "@chakra-ui/react"
import React from "react"

import { Narrative_typeA } from "../annotation_types/narrative_typeA"
import { Narrative_typeB } from "../annotation_types/narrative_typeB"
import type { GestaltAnnotation } from "./index"

interface Props {
  gestaltAnnotation: GestaltAnnotation
  field: keyof Narrative_typeA | keyof Narrative_typeB
  updateGestaltField: (
    field: keyof Narrative_typeA | keyof Narrative_typeB,
    value: string,
  ) => void
  postFreetextAnswerToServer: () => void
  paddingTop?: string
  children?: React.ReactNode
}

const Free_text: React.FC<Props> = ({
  gestaltAnnotation,
  field,
  updateGestaltField,
  postFreetextAnswerToServer,
  paddingTop = "40px",
  children,
}) => {
  return (
    <Box padding={"0px"} mt={paddingTop}>
      <Text ml="10px" fontSize={"lg"}>
        {children}
      </Text>
      <Textarea
        value={field in gestaltAnnotation ? gestaltAnnotation[field] : ""}
        onChange={(e) => updateGestaltField(field, e.target.value)}
        onBlur={postFreetextAnswerToServer}
      />
    </Box>
  )
}

export { Free_text }
