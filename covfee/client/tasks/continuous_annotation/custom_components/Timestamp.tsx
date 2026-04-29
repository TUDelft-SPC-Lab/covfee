import {
  Box,
  Button,
  HStack,
  Input,
  InputGroup,
  InputRightElement,
  Text,
} from "@chakra-ui/react"
import React from "react"

import { Narrative_typeA } from "../annotation_types/narrative_typeA"
import { Narrative_typeB } from "../annotation_types/narrative_typeB"

interface Props {
  narrative: Narrative_typeA | Narrative_typeB | null
  field_start: keyof Narrative_typeA | keyof Narrative_typeB
  field_end: keyof Narrative_typeA | keyof Narrative_typeB
  i: number
  updateNarrativeField: (
    narrativeIndex: number,
    field: keyof Narrative_typeA | keyof Narrative_typeB,
    value: string,
  ) => void
  updateNarrativeFieldAndSave: (
    narrativeIndex: number,
    field: keyof Narrative_typeA | keyof Narrative_typeB,
    value: string,
  ) => void
  postFreetextAnswerToServer: (payload?: {
    narratives?: (Narrative_typeA | Narrative_typeB | null)[]
    currentNarrativeIndex?: number
  }) => void
  paddingTop?: string
  children?: React.ReactNode

  getCurrentPausedTime: () => number
}

const Timestamp: React.FC<Props> = ({
  narrative,
  field_start,
  field_end,
  i,
  updateNarrativeField,
  updateNarrativeFieldAndSave,
  postFreetextAnswerToServer,
  paddingTop = "40px",
  children,
  getCurrentPausedTime,
}) => {
  return (
    <Box padding={"0px"} mt={paddingTop}>
      <Text
        ml="10px"
        fontSize={"lg"}
        marginBottom={"0px"}
        paddingBottom={"0px"}
      >
        {children}
      </Text>
      <Text ml="10px" fontSize={"sm"} marginTop={"0px"} paddingTop={"0px"}>
        {/* <i>Note: To select a precise moment, adjust the video using the progress bar, then click the appropriate button.</i> */}
        Pressing the <strong>"Start" or "End" button</strong> will automatically
        insert the video’s current time.
      </Text>
      <HStack>
        <Button
          colorScheme="blue"
          onClick={() => {
            updateNarrativeFieldAndSave(
              i,
              field_start,
              getCurrentPausedTime().toString(),
            )
          }}
        >
          Start
        </Button>
        <InputGroup width={"auto"}>
          <Input
            w="100px"
            type="number"
            step="0.01"
            value={
              field_start in narrative && narrative[field_start] !== ""
                ? Number(narrative[field_start]).toFixed(2)
                : ""
            }
            onChange={(e) =>
              updateNarrativeField(i, field_start, e.target.value)
            }
            onBlur={(e) => {
              const value = parseFloat(e.target.value)
              if (!isNaN(value)) {
                updateNarrativeFieldAndSave(i, field_start, value.toFixed(2))
              } else {
                postFreetextAnswerToServer()
              }
            }}
          />
          <InputRightElement pointerEvents="none">s</InputRightElement>
        </InputGroup>
        <Button
          colorScheme="blue"
          onClick={() => {
            updateNarrativeFieldAndSave(
              i,
              field_end,
              getCurrentPausedTime().toString(),
            )
          }}
        >
          End
        </Button>
        <InputGroup width={"auto"}>
          <Input
            w="100px"
            type="number"
            step="0.01"
            value={
              field_end in narrative && narrative[field_end] !== ""
                ? Number(narrative[field_end]).toFixed(2)
                : ""
            }
            onChange={(e) => updateNarrativeField(i, field_end, e.target.value)}
            onBlur={(e) => {
              const value = parseFloat(e.target.value)
              if (!isNaN(value)) {
                updateNarrativeFieldAndSave(i, field_end, value.toFixed(2))
              } else {
                postFreetextAnswerToServer()
              }
            }}
          />
          <InputRightElement pointerEvents="none">s</InputRightElement>
        </InputGroup>
      </HStack>
    </Box>
  )
}

export { Timestamp }
