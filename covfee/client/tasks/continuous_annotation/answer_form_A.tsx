import { DeleteOutlined, PlusOutlined } from "@ant-design/icons"
import {
  Button as ButtonChakra,
  Checkbox,
  IconButton,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  useDisclosure,
  VStack
} from "@chakra-ui/react"
import React from "react"

import { Narrative_typeA } from "../annotation_types/narrative_typeA"
import { Narrative_typeB } from "../annotation_types/narrative_typeB"
import { DeleteAlertDialogue } from "./custom_components/AlertDialog"
import { Free_text } from "./custom_components/free_text"
import { Likert_scale } from "./custom_components/likert_scale"

type Props = {
  videoLengthMismatch?: boolean
  narratives?: (Narrative_typeA | Narrative_typeB | null)[]
  setNarratives: (value: (Narrative_typeA | Narrative_typeB | null)[]) => void
  postFreetextAnswerToServer: () => void
  submitFreeTextToServer: () => void
  noIntentionSeen: boolean
  setNoIntentionSeen: (value: boolean) => void
}

const Answer_form_A: React.FC<Props> = ({
  videoLengthMismatch,
  narratives = [],
  setNarratives,
  postFreetextAnswerToServer,
  submitFreeTextToServer,
  noIntentionSeen,
  setNoIntentionSeen,
}) => {
  const [index, setIndex] = React.useState(0)

  /* ---------------- helpers ---------------- */

  const createBlankNarrativeA = (): Narrative_typeA => ({
    created_at: Date.now(),
    timestamp: Date.now(),
    intention_description: "",
    intention_description_confidence: null,
    intention_explanation: "",
    intention_explanation_confidence: null,
    intention_intensity: "",
  })

  const addNarrative = () => {
    setNarratives([...narratives, createBlankNarrativeA()])
    setIndex(narratives.length) // select newly added tab
  }

  const updateNarrativeField = (
    narrativeIndex: number,
    field: keyof Narrative_typeA,
    value: string
  ) => {
    setNarratives(
      narratives.map((narrative, i) =>
        i === narrativeIndex && narrative
          ? { ...narrative, [field]: value }
          : narrative
      )
    )
  }
    //Delete narrative confirmation dialog
    const { isOpen, onOpen, onClose } = useDisclosure()
    const deleteTab = () => {
        if (!narratives) return

        // remove narrative
        setNarratives(narratives.filter((_, i) => i !== index))

        // move index safely
        setIndex(prev => Math.max(0, prev - 1))

        onClose()
    }


  /* ---------------- validation ---------------- */

  const isNarrativeComplete = (
    narrative: Narrative_typeA | Narrative_typeB | null
  ): boolean => {
    if (!narrative) return false

    return Object.entries(narrative).every(([, value]) => {
      if (typeof value === "string") return value.trim().length > 0
      if (typeof value === "number") return Number.isFinite(value)
      return false
    })
  }

  const [submittable, setSubmittable] = React.useState(false)

  React.useEffect(() => {
    if (narratives.length === 0) {
      setSubmittable(false)
      return
    }
    setSubmittable(narratives.every(isNarrativeComplete))
  }, [narratives])

  /* ---------------- render ---------------- */

  return (
    <>
      <Tabs index={index} onChange={setIndex} variant="enclosed" height="100%">
        <TabList position={"sticky"} top={0} zIndex={1}>
          {narratives.map((narrative, i) => (
            <Tab key={narrative?.created_at}>Intention {i + 1}</Tab>
          ))}

         <IconButton
            aria-label="Add narrative"
            icon={<PlusOutlined />}
            size="sm"
            variant="ghost"
            onClick={addNarrative}
            ml={2}
            alignSelf="center" 
            />
        </TabList>

        <TabPanels maxH={"60vh"} overflowY={"auto"}>
          {narratives.map((narrative, i) => {
            if (!narrative) return null

            return (
              <TabPanel key={narrative?.created_at} position="relative">
                <IconButton
                    aria-label="Delete tab"
                    icon={<DeleteOutlined />}
                    size="md"
                    colorScheme="red"
                    variant="ghost"
                    position="absolute"
                    top="5px"
                    right="5px"
                    onClick={onOpen}
                    isDisabled={narratives.length === 1}
                />
                <Free_text paddingTop={"5px"} narrative={narrative} field={"intention_description"} i={i} updateNarrativeField={updateNarrativeField} postFreetextAnswerToServer={postFreetextAnswerToServer}>
                  <strong>Describe the Intention:</strong> What intention do you see at this moment? <br />Provide a brief description of what you think the person is trying to do. 
                </Free_text>
                <Likert_scale narrative={narrative} field={"intention_description_confidence"} i={i} updateNarrativeField={updateNarrativeField} postFreetextAnswerToServer={postFreetextAnswerToServer}>
                  <strong>Confidence:</strong> On a scale of 1-5, how confident are you in this interpretation? 
                </Likert_scale>
                <Free_text narrative={narrative} field={"intention_explanation"} i={i} updateNarrativeField={updateNarrativeField} postFreetextAnswerToServer={postFreetextAnswerToServer}>
                  <strong>Why?</strong> Provide the evidence from the video or audio that led you to this conclusion. 
                </Free_text>
                <Likert_scale narrative={narrative} field={"intention_explanation_confidence"} i={i} updateNarrativeField={updateNarrativeField} postFreetextAnswerToServer={postFreetextAnswerToServer}>
                  <strong>Confidence:</strong> On a scale of 1-5, how confident are you in this explanation? 
                </Likert_scale>
                <Likert_scale narrative={narrative} field={"intention_intensity"} i={i} updateNarrativeField={updateNarrativeField} postFreetextAnswerToServer={postFreetextAnswerToServer} extremes={["Low priority", "High priority"]}>
                  <strong>Intensity:</strong> On a scale of 1-5, how much of a priority do you think this intention is for the participant? 
                </Likert_scale>
              </TabPanel>
            )
          })}
        </TabPanels>
      </Tabs>
      <VStack spacing={4} align="stretch" mt="40px">
        <ButtonChakra
          mt="10px"
          colorScheme="blue"
          onClick={submitFreeTextToServer}
          isDisabled={videoLengthMismatch || (!submittable && !noIntentionSeen)}
        >
          Submit Annotation
        </ButtonChakra>
        <Checkbox paddingBottom={"15px"} onChange={(e) => setNoIntentionSeen(e.target.checked)} isChecked={noIntentionSeen}><strong>No Intention:</strong> If you watch the entire clip and see no clear intention, you may check the box. </Checkbox>
      </VStack>
      <DeleteAlertDialogue isOpen={isOpen} onClose={onClose} deleteTab={deleteTab} />

    </>
    
  )
  
}

export { Answer_form_A }

