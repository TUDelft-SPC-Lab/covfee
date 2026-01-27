import { PlusOutlined } from "@ant-design/icons"
import {
    Button as ButtonChakra,
    Tab,
    TabList,
    TabPanel,
    TabPanels,
    Tabs,
    Text,
    Textarea,
} from "@chakra-ui/react"
import React from "react"

import { Narrative_typeA } from "../annotation_types/narrative_typeA"
import { Narrative_typeB } from "../annotation_types/narrative_typeB"

type Props = {
  videoLengthMismatch?: boolean
  narratives?: (Narrative_typeA | Narrative_typeB | null)[]
  setNarratives: (value: (Narrative_typeA | Narrative_typeB | null)[]) => void
  postFreetextAnswerToServer: () => void
  submitFreeTextToServer: () => void
}

const Answer_form_B: React.FC<Props> = ({
  videoLengthMismatch,
  narratives = [],
  setNarratives,
  postFreetextAnswerToServer,
  submitFreeTextToServer,
}) => {
  const [index, setIndex] = React.useState(0)

  /* ---------------- helpers ---------------- */

  const createBlankNarrativeB = (): Narrative_typeB => ({
    timestamp: Date.now(),
    intention_description: "",
    intention_belief: "",
    intention_desire: "",
  })

  const addNarrative = () => {
    setNarratives([...narratives, createBlankNarrativeB()])
    setIndex(narratives.length) // select newly added tab
  }

  const updateNarrativeField = (
    narrativeIndex: number,
    field: keyof Narrative_typeB,
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
      <Tabs index={index} onChange={setIndex} variant="enclosed">
        <TabList>
          {narratives.map((_, i) => (
            <Tab key={i}>Participant {i + 1}</Tab>
          ))}

          <Tab
            onClick={e => {
              e.preventDefault()
              addNarrative()
            }}
          >
            <PlusOutlined />
          </Tab>
        </TabList>

        <TabPanels>
          {narratives.map((narrative, i) => {
            if (!narrative) return null

            return (
              <TabPanel key={i}>
                <Text mt="10px" ml="10px">
                  Form B: What intention do you see in the video:
                </Text>
                <Textarea
                  value={
                    "intention_description" in narrative
                      ? narrative.intention_description
                      : ""
                  }
                  onChange={e =>
                    updateNarrativeField(
                      i,
                      "intention_description",
                      e.target.value
                    )
                  }
                  onBlur={postFreetextAnswerToServer}
                />

                <Text mt="20px" ml="10px">
                  Explain why you believe it to be their intention in term of their beliefs:
                </Text>
                <Textarea
                  value={
                    "intention_belief" in narrative
                      ? narrative.intention_belief
                      : ""
                  }
                  onChange={e =>
                    updateNarrativeField(
                      i,
                      "intention_belief",
                      e.target.value
                    )
                  }
                  onBlur={postFreetextAnswerToServer}
                />
                <Text mt="20px" ml="10px">
                  Explain why you believe it to be their intention in term of their desires:
                </Text>
                <Textarea
                  value={
                    "intention_desire" in narrative
                      ? narrative.intention_desire
                      : ""
                  }
                  onChange={e =>
                    updateNarrativeField(
                      i,
                      "intention_desire",
                      e.target.value
                    )
                  }
                  onBlur={postFreetextAnswerToServer}
                />
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
    </div>
  )
}

export { Answer_form_B }
