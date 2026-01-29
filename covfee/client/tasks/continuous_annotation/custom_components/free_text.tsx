import {
    Box,
    Text,
    Textarea
} from "@chakra-ui/react"
import React from "react"

import { Narrative_typeA } from "../annotation_types/narrative_typeA"
import { Narrative_typeB } from "../annotation_types/narrative_typeB"

interface Props {
    narrative: Narrative_typeA | Narrative_typeB | null
    field : keyof Narrative_typeA | keyof Narrative_typeB
    i: number
    updateNarrativeField: (
        narrativeIndex: number,
        field: keyof Narrative_typeA | keyof Narrative_typeB,
        value: string
    ) => void
    postFreetextAnswerToServer: () => void
    paddingTop?: string
    children?: React.ReactNode
}

const Free_text: React.FC<Props> = ({ narrative, field, i, updateNarrativeField, postFreetextAnswerToServer, paddingTop = "40px", children }) => {
    return(
        <Box padding={"0px"} mt={paddingTop}>
        <Text ml="10px" fontSize={"lg"} fontWeight={"bold"}>
            {children}
        </Text>
        <Textarea
            value={
            field in narrative
                ? narrative[field]
                : ""
            }
            onChange={e =>
            updateNarrativeField(
                i,
                field,
                e.target.value
            )
            }
            onBlur={postFreetextAnswerToServer}
        />
        </Box>
    )
}

export { Free_text }
