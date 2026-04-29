import { Box, Flex, Radio, RadioGroup, Text } from "@chakra-ui/react"
import React from "react"

import { Narrative_typeA } from "../annotation_types/narrative_typeA"
import { Narrative_typeB } from "../annotation_types/narrative_typeB"

interface Props {
  narrative: Narrative_typeA | Narrative_typeB | null
  field: keyof Narrative_typeA | keyof Narrative_typeB
  i: number
  updateNarrativeField: (
    narrativeIndex: number,
    field: keyof Narrative_typeA | keyof Narrative_typeB,
    value: string,
  ) => void
  postFreetextAnswerToServer: (payload?: {
    narratives?: (Narrative_typeA | Narrative_typeB | null)[]
    currentNarrativeIndex?: number
  }) => void
  extremes?: [string, string]
  children?: React.ReactNode
}

const Likert_scale: React.FC<Props> = ({
  narrative,
  field,
  i,
  updateNarrativeField,
  postFreetextAnswerToServer,
  extremes = ["Just a guess", "Very confident"],
  children,
}) => {
  return (
    <Box padding={"0px"}>
      <Text mt="30px" ml="10px" fontSize={"lg"} mb={"0px"}>
        {children}
      </Text>
      <Box paddingTop={"5px"}>
        <Flex justify="space-between" mb={1} px={2}>
          <Text fontSize="sm">{extremes[0]}</Text>
          <Text fontSize="sm">{extremes[1]}</Text>
        </Flex>
        <RadioGroup
          onChange={(e) => updateNarrativeField(i, field, e)}
          value={
            field in narrative && narrative[field] != null
              ? narrative[field].toString()
              : undefined
          }
          onBlur={() => postFreetextAnswerToServer()}
        >
          <Flex justify="space-between" px={10}>
            <Radio value="1" />
            <Radio value="2" />
            <Radio value="3" />
            <Radio value="4" />
            <Radio value="5" />
          </Flex>
        </RadioGroup>
      </Box>
    </Box>
  )
}

export { Likert_scale }
