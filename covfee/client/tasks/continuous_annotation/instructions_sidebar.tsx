import type { MenuProps } from "antd"
import { MenuInfo, Modal } from "antd"
import React, { useEffect, useState } from "react"

import {
  BorderOutlined,
  CheckSquareTwoTone,
  QuestionCircleTwoTone,
} from "@ant-design/icons"

import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Box,
  ListItem,
  Text,
  Tooltip,
  UnorderedList,
} from "@chakra-ui/react"

import styles from "./continous_annotation.module.css"
import { Participant_image } from "./custom_components/participant_image"

type ParticipantOption = {
  name: string
  completed: boolean
}

type AnnotationOption = {
  category: string
  index?: number
  completed: boolean
}

type Props = {
  selected_participant: number
  selected_annotation: AnnotationOption
  participant_options: ParticipantOption[]
  annotation_options: AnnotationOption[]
  video_tutorial_url?: string
  answerForm: React.ReactNode
  onTooltipObserved: (
    tooltip:
      | "Cues"
      | "Situation characteristics"
      | "Situation type"
      | "Social Scripts",
  ) => void

  onCantFindParticipant: () => void
  onParticipantSelected: (participant: string) => void
  onAnnotationSelected: (annotation_index: number) => void
  onStartStopAnnotationClick: () => void
  onOpenParticipantSelectionClick: () => void
  onWatchTutorialVideoClick: () => void
}

const InstructionsSidebar: React.FC<Props> = (props) => {
  // Modal dialogs control
  const [checkingWhetherToRedoAnnotation, setCheckingWhetherToRedoAnnotation] =
    useState(false)
  const [isMarkParticipantModalOpen, setIsMarkParticipantModalOpen] =
    useState(false)

  // We prepare the participants options in the menu
  const participants_menu_items: MenuProps["items"] = [
    {
      key: "1",
      type: "group",
      label: "Select participant",
      children: props.participant_options.map((option: ParticipantOption) => ({
        key: option.name,
        label: option.name,
        icon: option.completed ? <CheckSquareTwoTone /> : <BorderOutlined />,
        onClick: (item: MenuInfo) => {
          props.onParticipantSelected(item.key)
        },
      })),
    },
  ]

  // We prepare the annotations options
  const annotations_menu_items: MenuProps["items"] = [
    {
      key: "1",
      type: "group",
      label: "Select annotation",
      children: props.annotation_options.map((option: AnnotationOption) => ({
        key: option.index,
        label: option.category,
        icon: option.completed ? <CheckSquareTwoTone /> : <BorderOutlined />,
        onClick: (item: MenuInfo) => {
          props.onAnnotationSelected(item.key)
        },
      })),
    },
  ]

  const handleStartRedoAnnotationClick = () => {
    if (props.selected_annotation.completed) {
      setCheckingWhetherToRedoAnnotation(true)
    } else {
      props.onStartStopAnnotationClick()
    }
  }

  useEffect(() => {
    if (checkingWhetherToRedoAnnotation) {
      Modal.confirm({
        title: "Are you sure you want to redo this annotation?",
        okText: "Yes",
        onOk: () => {
          setCheckingWhetherToRedoAnnotation(false)
          props.onStartStopAnnotationClick()
        },
        onCancel: () => {
          setCheckingWhetherToRedoAnnotation(false)
        },
      })
    }
  }, [checkingWhetherToRedoAnnotation])

  const multiple_annotations_for_selected_participant =
    props.annotation_options.length > 1

  const handleRubricAccordionChange = (expandedIndex: number | number[]) => {
    const hasOpenPanel = Array.isArray(expandedIndex)
      ? expandedIndex.length > 0
      : expandedIndex >= 0

    if (!hasOpenPanel) {
      return
    }

    // Wait for accordion expansion to affect layout before scrolling.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const scrollContainer = document.getElementById(
          "JourneyContentContainer",
        )

        if (scrollContainer) {
          scrollContainer.scrollTo({
            top: scrollContainer.scrollHeight,
            behavior: "smooth",
          })
        }

        window.scrollTo({
          top: document.documentElement.scrollHeight,
          behavior: "smooth",
        })
      })
    })
  }

  return (
    <>
      <div className={styles["sidebar-block"]}>
        <h1>Instructions</h1>
        <Text fontSize={"md"}>
          <strong>Welcome!</strong> In this task, you will watch a 30-second
          video clip. Identify the intentions of the participant indicated
          below. Then, briefly explain your reasoning. Your answers will be
          graded according to the rubric provided. High-quality responses can
          earn you an additional monetary bonus.
        </Text>
        <Participant_image participant_id={[props.selected_participant]} />
        <Text fontSize={"md"}>
          An <strong>intention</strong> is what a person wants to{" "}
          <strong>achieve</strong>, based on <strong>beliefs</strong> about the
          situation and what they <strong>desire</strong> to happen.
        </Text>
        <Text fontSize={"md"}>
          Use your first impression and own intuition; there are no right or
          wrong answers.
        </Text>
        <Text>
          Do not look up definitions or use AI tools (e.g., ChatGPT) to complete
          any of this task.
        </Text>
        <Text fontSize={"lg"} marginBottom={"5px"}>
          <strong>Interpreting the Situation </strong>
        </Text>
        <Text fontSize={"md"}>
          When forming your interpretation, you may consider:
        </Text>
        <UnorderedList fontSize="md" pl="20px" spacing={2}>
          <ListItem>
            <strong>Cues:</strong>Directly observable or audible elements.{" "}
            <br /> This includes actions, gestures, speech, objects, sounds, and
            locations.{" "}
            <Tooltip
              hasArrow
              onOpen={() => props.onTooltipObserved("Cues")}
              label={
                <>
                  <strong>Ask yourself:</strong> What can I directly see or
                  hear?
                </>
              }
              bg="gray.300"
              color="black"
            >
              <QuestionCircleTwoTone />
            </Tooltip>
          </ListItem>
          <ListItem>
            <strong>Situation characteristics:</strong> The general feel or
            atmosphere of the interaction as a whole.
            <Tooltip
              hasArrow
              onOpen={() =>
                props.onTooltipObserved("Situation characteristics")
              }
              label={
                <>
                  <strong>Ask yourself:</strong> How does the situation feel
                  overall?
                  <br />
                  Examples: tense, relaxed, awkward, friendly, formal, hostile.
                </>
              }
              bg="gray.300"
              color="black"
            >
              <QuestionCircleTwoTone />
            </Tooltip>
          </ListItem>
          <ListItem>
            <strong>Situation type:</strong> The category or context of the
            interaction, including assumptions about roles or relationships.
            <Tooltip
              hasArrow
              onOpen={() => props.onTooltipObserved("Situation type")}
              label={
                <>
                  <strong>Ask yourself:</strong> What kind of situation is this?
                  <br />
                  Examples: job interview, casual conversation, negotiation,
                  strangers meeting, boss–employee interaction.
                </>
              }
              bg="gray.300"
              color="black"
            >
              <QuestionCircleTwoTone />
            </Tooltip>
          </ListItem>
          <ListItem>
            <strong>Social Scripts:</strong> The step-by-step mental plan people
            follow to achieve a goal in a social setting or expected playbook of
            the situation.
            <Tooltip
              hasArrow
              onOpen={() => props.onTooltipObserved("Social Scripts")}
              label={
                <>
                  <strong>Ask yourself:</strong> What is the expected sequence
                  of events here? Who usually does what?
                  <br />
                  Examples: greeting → introduction → conversation, ordering →
                  paying → leaving, turn-taking in conversation
                </>
              }
              bg="gray.300"
              color="black"
            >
              <QuestionCircleTwoTone />
            </Tooltip>
          </ListItem>
        </UnorderedList>
        <Text fontSize={"lg"} marginBottom={"5px"}>
          <strong>How to Annotate </strong>
        </Text>
        <Text fontSize={"md"} marginBottom={"5px"}>
          <strong>1. Watch and Pause: </strong>Watch the clip and pause as soon
          as you notice an intention.
          <br />
          Adjust the timestamp to mark <strong>
            the exact start and end
          </strong>{" "}
          of the intention.
        </Text>
        <Text fontSize={"md"} marginBottom={"5px"}>
          <strong>2. Do you see multiple possibilities?</strong> Click “
          <strong>+</strong>” to add more entries if you see multiple intentions
          or interpretations.
        </Text>
        <Text fontSize={"md"} marginBottom={"5px"}>
          <strong>3. Give your reasoning: </strong>Complete the questionnaire
          under the video. Use your first impression and intuition; there is no
          right or wrong answer.
        </Text>
        <Text fontSize={"md"} marginBottom={"5px"}>
          <strong>4. Continue the search: </strong>Resume the video and repeat
          this process for every new intention you see until the clip ends. If
          you have annotated the full video, you may submit.
        </Text>

        <Accordion
          defaultIndex={[]}
          allowMultiple
          onChange={handleRubricAccordionChange}
        >
          <AccordionItem>
            <h2>
              <AccordionButton>
                <Box as="span" flex="1" textAlign="left">
                  <Text fontSize={"lg"} marginBottom={"5px"}>
                    <strong>Grading rubric: </strong>
                  </Text>
                </Box>
                <AccordionIcon />
              </AccordionButton>
            </h2>
            <AccordionPanel pb={4}>
              <Text fontSize={"md"} marginBottom={"5px"}>
                Your response will be evaluated based on the following criteria:{" "}
              </Text>
              <UnorderedList fontSize="md" pl="20px" spacing={2}>
                <ListItem>
                  <strong>Intention (not just actions):</strong> Describe what
                  the participant is trying to achieve, not just what they are
                  doing. Actions alone (cues) are not enough you must also
                  include a goal.
                </ListItem>
                <ListItem>
                  <strong>Assumptions about the participant:</strong> Include
                  what you assume about the participant’s beliefs or desires.
                  What do they think is happening? What do they want?
                </ListItem>
                <ListItem>
                  <strong>Assumptions about the situation: </strong> Use your
                  interpretation of the situation to support your answer, based
                  on:
                  <UnorderedList styleType="-">
                    <ListItem>
                      <strong>Situation type</strong> (what kind of situation
                      this is) 
                    </ListItem>
                    <ListItem>
                      <strong>Social scripts</strong> (what typically happens in
                      this situation)
                    </ListItem>
                    <ListItem>
                      <strong>Situation characteristics</strong> (overall tone)
                    </ListItem>
                  </UnorderedList>
                </ListItem>
              </UnorderedList>
              <Text fontSize={"md"} marginBottom={"5px"}>
                Show how the context or social norms inform your interpretation.
              </Text>
            </AccordionPanel>
          </AccordionItem>
        </Accordion>
      </div>
    </>
  )
}

export { AnnotationOption, InstructionsSidebar, ParticipantOption }
