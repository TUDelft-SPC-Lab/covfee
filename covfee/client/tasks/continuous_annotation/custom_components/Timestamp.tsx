import {
    Box,
    Button,
    HStack,
    Input,
    Text
} from "@chakra-ui/react"
import React from "react"

import { Narrative_typeA } from "../annotation_types/narrative_typeA"
import { Narrative_typeB } from "../annotation_types/narrative_typeB"

interface Props {
    narrative: Narrative_typeA | Narrative_typeB | null
    field_start : keyof Narrative_typeA | keyof Narrative_typeB
    field_end : keyof Narrative_typeA | keyof Narrative_typeB
    i: number
    updateNarrativeField: (
        narrativeIndex: number,
        field: keyof Narrative_typeA | keyof Narrative_typeB,
        value: string
    ) => void
    postFreetextAnswerToServer: () => void
    paddingTop?: string
    children?: React.ReactNode

    getCurrentPausedTime: () => number;
}

const Timestamp: React.FC<Props> = ({ narrative, field_start, field_end, i, updateNarrativeField, postFreetextAnswerToServer, paddingTop = "40px", children, getCurrentPausedTime }) => {
    return(
        <Box padding={"0px"} mt={paddingTop}>
        <Text ml="10px" fontSize={"lg"} marginBottom={"0px"} paddingBottom={"0px"}>
            {children}
        </Text>
        <Text ml="10px" fontSize={"sm"} marginTop={"0px"} paddingTop={"0px"}>
            <i>Note: To select a precise moment, adjust the video using the progress bar, then click the appropriate button.</i>
        </Text>
        <HStack>
            <Button colorScheme="blue" onClick={() => {
                updateNarrativeField(i, field_start, getCurrentPausedTime().toString())
                postFreetextAnswerToServer()
            }}>Start</Button>
            <Input value={
            field_start in narrative
                ? narrative[field_start]
                : ""
            }
            onChange={e =>
            updateNarrativeField(
                i,
                field_start,
                e.target.value
            )
            }
            onBlur={postFreetextAnswerToServer}/>
            <Button colorScheme="blue" onClick={() => {
                updateNarrativeField(i, field_end, getCurrentPausedTime().toString())
                postFreetextAnswerToServer()
            }}>End</Button>
            <Input value={
            field_end in narrative
                ? narrative[field_end]
                : ""
            }
            onChange={e =>
            updateNarrativeField(
                i,
                field_end,
                e.target.value
            )
            }
            onBlur={postFreetextAnswerToServer}/>
        </HStack>
        </Box>
    )
}

export { Timestamp }
