import { DeleteOutlined, PlusOutlined } from "@ant-design/icons"
import {
  Button as ButtonChakra,
  IconButton,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  useDisclosure
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
}

const Answer_form_A: React.FC<Props> = ({
  videoLengthMismatch,
  narratives = [],
  setNarratives,
  postFreetextAnswerToServer,
  submitFreeTextToServer,
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
    <div>
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
                  Form A: What intention do you see in the video:
                </Free_text>
                <Likert_scale narrative={narrative} field={"intention_description_confidence"} i={i} updateNarrativeField={updateNarrativeField} postFreetextAnswerToServer={postFreetextAnswerToServer}>
                  How confident are you that this is the intention?
                </Likert_scale>
                <Free_text narrative={narrative} field={"intention_explanation"} i={i} updateNarrativeField={updateNarrativeField} postFreetextAnswerToServer={postFreetextAnswerToServer}>
                  Explain why you believe it to be their intention:
                </Free_text>
                <Likert_scale narrative={narrative} field={"intention_explanation_confidence"} i={i} updateNarrativeField={updateNarrativeField} postFreetextAnswerToServer={postFreetextAnswerToServer}>
                  How confident are you about this explanation?
                </Likert_scale>
                <Likert_scale narrative={narrative} field={"intention_intensity"} i={i} updateNarrativeField={updateNarrativeField} postFreetextAnswerToServer={postFreetextAnswerToServer}>
                  With what intensity is the intention being carried out?
                </Likert_scale>
              </TabPanel>
            )
          })}
        </TabPanels>
      </Tabs>
      <ButtonChakra
        mt="10px"
        colorScheme="blue"
        onClick={submitFreeTextToServer}
        isDisabled={videoLengthMismatch || !submittable}
      >
        Submit Annotation
      </ButtonChakra>
      <DeleteAlertDialogue isOpen={isOpen} onClose={onClose} deleteTab={deleteTab} />

    </div>
    
  )
  
}

export { Answer_form_A }

