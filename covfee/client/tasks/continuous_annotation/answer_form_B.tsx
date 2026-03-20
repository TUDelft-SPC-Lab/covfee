import { DeleteOutlined, PlusOutlined } from "@ant-design/icons"
import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Button,
  Button as ButtonChakra,
  Checkbox,
  IconButton,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  useDisclosure,
  VStack,
} from "@chakra-ui/react"
import React from "react"

import { Narrative_typeA } from "../annotation_types/narrative_typeA"
import { Narrative_typeB } from "../annotation_types/narrative_typeB"
import { DeleteAlertDialogue } from "./custom_components/AlertDialog"
import { Free_text } from "./custom_components/free_text"
import { Likert_scale } from "./custom_components/likert_scale"
import { Timestamp } from "./custom_components/Timestamp"

type Props = {
  videoLengthMismatch?: boolean
  narratives?: (Narrative_typeA | Narrative_typeB | null)[]
  setNarratives: (value: (Narrative_typeA | Narrative_typeB | null)[]) => void
  postFreetextAnswerToServer: () => void
  submitFreeTextToServer: () => void
  setNoIntentionSeen: (value: boolean) => void
  noIntentionSeen: boolean
  getCurrentPausedTime: () => number
  onNarrativeIndexChange: (value: number) => void
  submitDialogueText?: React.JSX.Element
}

const Answer_form_B: React.FC<Props> = ({
  videoLengthMismatch,
  narratives = [],
  setNarratives,
  postFreetextAnswerToServer,
  submitFreeTextToServer,
  setNoIntentionSeen,
  noIntentionSeen,
  getCurrentPausedTime,
  onNarrativeIndexChange,
  submitDialogueText,
}) => {
  const [index, setIndex] = React.useState(0)
  const setIndexAndNotify = (nextIndex: number) => {
    setIndex(nextIndex)
    onNarrativeIndexChange(nextIndex)
  }

  const [isOpenSubmit, setIsOpenSubmit] = React.useState(false)
  const onCloseSubmit = () => setIsOpenSubmit(false)
  const cancelRefSubmit = React.useRef<HTMLButtonElement>(null)
  const submitOpenPopUp = () => {
    setIsOpenSubmit(true)
  }

  /* ---------------- helpers ---------------- */

  const createBlankNarrativeB = (): Narrative_typeB => ({
    created_at: Date.now(),
    timestamp_start: 0,
    timestamp_end: 0,
    intention_description: "",
    intention_description_confidence: null,
    intention_explanation: "",
    intention_explanation_confidence: null,
    intention_intensity: "",
    counterfactual_explanation: "",
    narrative_index: narratives.length,
  })

  const addNarrative = () => {
    setNarratives([...narratives, createBlankNarrativeB()])
    setIndexAndNotify(narratives.length) // select newly added tab
  }

  const updateNarrativeField = (
    narrativeIndex: number,
    field: keyof Narrative_typeB,
    value: string,
  ) => {
    setNarratives(
      narratives.map((narrative, i) =>
        i === narrativeIndex && narrative
          ? { ...narrative, [field]: value }
          : narrative,
      ),
    )
  }
  //Delete narrative confirmation dialog
  const {
    isOpen: isOpenDelete,
    onOpen: onOpenDelete,
    onClose: onCloseDelete,
  } = useDisclosure()
  const deleteTab = () => {
    if (!narratives) return

    // remove narrative
    setNarratives(narratives.filter((_, i) => i !== index))

    // move index safely
    setIndexAndNotify(Math.max(0, index - 1))

    onCloseDelete()
  }
  /* ---------------- validation ---------------- */

  const isNarrativeComplete = (
    narrative: Narrative_typeA | Narrative_typeB | null,
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
      <Tabs
        index={index}
        onChange={setIndexAndNotify}
        variant="enclosed"
        height="100%"
      >
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
                  size="s"
                  colorScheme="red"
                  variant="ghost"
                  position="absolute"
                  top="8px"
                  right="8px"
                  onClick={onOpenDelete}
                  isDisabled={narratives.length === 1}
                />
                <Timestamp
                  paddingTop={"5px"}
                  narrative={narrative}
                  field_start={"timestamp_start"}
                  field_end={"timestamp_end"}
                  i={i}
                  updateNarrativeField={updateNarrativeField}
                  postFreetextAnswerToServer={postFreetextAnswerToServer}
                  getCurrentPausedTime={getCurrentPausedTime}
                >
                  <strong>Timestamps:</strong> Mark the start and end times at
                  which you perceive this intention in the video.
                </Timestamp>
                <Free_text
                  narrative={narrative}
                  field={"intention_description"}
                  i={i}
                  updateNarrativeField={updateNarrativeField}
                  postFreetextAnswerToServer={postFreetextAnswerToServer}
                >
                  <strong>Describe the Intention:</strong> What intention do you
                  see at this moment? <br />
                  Provide a brief description of what you think the person is
                  trying to do.
                </Free_text>
                <Likert_scale
                  narrative={narrative}
                  field={"intention_description_confidence"}
                  i={i}
                  updateNarrativeField={updateNarrativeField}
                  postFreetextAnswerToServer={postFreetextAnswerToServer}
                >
                  <strong>Confidence:</strong> On a scale of 1-5, how confident
                  are you in this interpretation?
                </Likert_scale>
                <Free_text
                  narrative={narrative}
                  field={"intention_explanation"}
                  i={i}
                  updateNarrativeField={updateNarrativeField}
                  postFreetextAnswerToServer={postFreetextAnswerToServer}
                >
                  <strong>Why?</strong> Provide the evidence from the video or
                  audio that led you to this conclusion.
                </Free_text>
                <Likert_scale
                  narrative={narrative}
                  field={"intention_explanation_confidence"}
                  i={i}
                  updateNarrativeField={updateNarrativeField}
                  postFreetextAnswerToServer={postFreetextAnswerToServer}
                >
                  <strong>Confidence:</strong> On a scale of 1-5, how confident
                  are you in this explanation?
                </Likert_scale>
                <Likert_scale
                  narrative={narrative}
                  field={"intention_intensity"}
                  i={i}
                  updateNarrativeField={updateNarrativeField}
                  postFreetextAnswerToServer={postFreetextAnswerToServer}
                  extremes={[
                    "Not pursuing it actively",
                    "Actively and strongly pursuing it",
                  ]}
                >
                  <strong>Intensity:</strong> On a scale of 1-5, how much of a
                  priority does this intention appear to be for the participant?
                </Likert_scale>
                <Free_text
                  narrative={narrative}
                  field={"counterfactual_explanation"}
                  i={i}
                  updateNarrativeField={updateNarrativeField}
                  postFreetextAnswerToServer={postFreetextAnswerToServer}
                >
                  <strong>Counterfactual Explanation:</strong> Can you think of
                  an alternative way the situation could be interpreted that
                  would lead to a very different understanding of the
                  participant’s intentions? Describe the assumption or
                  interpretation that would change your understanding.
                </Free_text>
              </TabPanel>
            )
          })}
        </TabPanels>
      </Tabs>
      <VStack spacing={4} align="stretch" mt={"40px"}>
        <ButtonChakra
          mt="10px"
          colorScheme="blue"
          onClick={() => setIsOpenSubmit(true)}
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
      <DeleteAlertDialogue
        isOpen={isOpenDelete}
        onClose={onCloseDelete}
        deleteTab={deleteTab}
      />
      <AlertDialog
        isOpen={isOpenSubmit}
        leastDestructiveRef={cancelRefSubmit}
        onClose={onCloseSubmit}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Continue?
            </AlertDialogHeader>

            <AlertDialogBody>{submitDialogueText}</AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRefSubmit} onClick={onCloseSubmit}>
                Cancel
              </Button>
              <Button
                colorScheme="blue"
                onClick={async () => {
                  await submitFreeTextToServer()
                  onCloseSubmit()
                }}
                ml={3}
              >
                Yes, Continue
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </>
  )
}

export { Answer_form_B }
