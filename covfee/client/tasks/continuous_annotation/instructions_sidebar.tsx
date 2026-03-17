import type { MenuProps } from "antd"
import { MenuInfo, Modal } from "antd"
import React, { useEffect, useState } from "react"

import { BorderOutlined, CheckSquareTwoTone } from "@ant-design/icons"

import { ListItem, OrderedList, Text } from "@chakra-ui/react"

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

  return (
    <>
      <div className={styles["sidebar-block"]}>
        <h1>Instructions</h1>
        <Text fontSize={"md"}>
          <strong>Welcome!</strong> In this task, you will watch a 30-second
          video clip. Identify the intentions of the participant indicated
          below. Then, briefly explain your reasoning.
        </Text>
        {props.answerForm === "A" && (
          <>
            <Participant_image participant_id={[props.selected_participant]} />
            <Text fontSize={"md"}>
              Use your first impression and own intuition; there are no right or
              wrong answers.
            </Text>
            <Text fontSize={"md"}>
              Do not look up definitions or use AI tools (e.g., ChatGPT) to
              complete any of this task.
            </Text>
          </>
        )}
        {props.answerForm === "B" && (
          <>
            <Participant_image participant_id={[props.selected_participant]} />
            <Text fontSize={"md"}>
              An <strong>intention</strong> is what a person wants to{" "}
              <strong>achieve</strong>, based on <strong>beliefs</strong>
              about the situation and what they <strong>desire</strong> to
              happen.
            </Text>
            <Text fontSize={"md"}>
              Use your first impression and own intuition; there are no right or
              wrong answers.
            </Text>
            <Text fontSize={"md"}>
              Do not look up definitions or use AI tools (e.g., ChatGPT) to
              complete any of this task.
            </Text>
            <Text fontSize={"md"}>
              When forming your interpretation, you may consider:
            </Text>
            <OrderedList fontSize="md" pl="20px" spacing={2}>
              <ListItem>
                <strong>Cues:</strong> Directly observable or audible elements
                e.g. actions, objects, sounds, or locations, etc.
              </ListItem>
              <ListItem>
                <strong>Situation characteristics:</strong> The overall feel or
                tone of the situation (e.g., tense, casual, pleasant).
              </ListItem>
              <ListItem>
                <strong>Situation type:</strong> What kind of situation the
                participant might think they are in.
              </ListItem>
              <ListItem>
                <strong>Social Scripts:</strong> Typical patterns or mental
                "how-to" guides for how social interactions usually unfold.
              </ListItem>
            </OrderedList>
          </>
        )}

        <Text fontSize={"md"} marginBottom={"5px"}>
          <strong>1. Watch and pause:</strong> Watch the clip and{" "}
          <strong>pause as soon as you perceive an intention</strong>{" "}
        </Text>
        <Text fontSize={"md"}>
          Adjust the timestamp to mark <strong>the exact start and end</strong>{" "}
          of the intention.
        </Text>
        {/* <Text fontSize={"md"}><strong>2. Timestamps</strong> Mark the start and end of when you perceive the intention in the video.</Text>
        <Text fontSize={"md"}>You can either:</Text>
        <OrderedList fontSize="md" pl="20px" spacing={2}>
          <ListItem>
            <strong>Click the Start or End button</strong> to automatically insert the video’s current time, or
          </ListItem>
          <ListItem>
            <strong>Manually enter a timestamp</strong> in the corresponding text box.
          </ListItem>
        </OrderedList> */}
        {/* <Text fontSize={"md"}>
          To select a precise moment, adjust the video using the progress bar,
          then click the appropriate button.
        </Text> */}
        <Text fontSize={"md"}>
          <strong>2. Multiple Intentions: </strong>If you think{" "}
          <strong>multiple intentions</strong> are present or several
          interpretations are possible, click “<strong>+</strong>” to add
          another entry.
        </Text>
        <Text fontSize={"md"}>
          <strong>3. Answer the questions: </strong>Complete the questionnaire
          under the video with your honest interpretation and reasoning.
        </Text>
      </div>
    </>
  )
}

export { AnnotationOption, InstructionsSidebar, ParticipantOption }
