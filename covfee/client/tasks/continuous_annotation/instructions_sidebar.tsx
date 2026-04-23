import type { MenuProps } from "antd"
import { MenuInfo, Modal } from "antd"
import React, { useEffect, useState } from "react"

import { BorderOutlined, CheckSquareTwoTone } from "@ant-design/icons"

import { Text } from "@chakra-ui/react"

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
  console.log("selected annotation in sidebar", props.selected_participant)
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
        <>
          <Text fontSize={"md"}>
            <strong>Welcome!</strong> In this task, you will watch a video. Your
            goal is to identify the <strong>actions</strong> of the participant
            (shown below) as they happen.
          </Text>
          <Participant_image participant_id={[props.selected_participant]} />
        </>
        <Text fontSize={"md"}>
          Key Map:(1: Gesture, 2: Drinking, 3: Toasting, 4: Nodding)
        </Text>
        <Text fontSize={"md"}>
          <strong>Classes of Actions:</strong>
        </Text>
        <Text fontSize={"md"}>
          <strong>Gesture</strong>: The participant is making a communicative
          gesture, such as waving or pointing. This includes the moment they
          start moving their hand to make the gesture, until the moment they
          finish the gesture and return their hand to rest.
        </Text>
        <Text fontSize={"md"}>
          <strong>Drinking</strong>: The participant is drinking from a cup.
          This includes the moment they bring the cup to their mouth, until the
          moment they move the cup away from their mouth after taking a sip.
        </Text>
        <Text fontSize={"md"}>
          <strong>Toasting</strong>: The participant is raising a cup to make a
          toast. This includes the moment they start raising the cup, until the
          moment they finish the toast and return the cup to rest.
        </Text>
        <Text fontSize={"md"}>
          <strong>Nodding</strong>: The participant is nodding their head. This
          includes the moment they start moving their head to make the nodding,
          until the moment they finish the nodding sequence and return their
          head to rest.
        </Text>
        <Text fontSize={"md"} marginBottom={"5px"}>
          <strong>1. Watch and press:</strong> Please watch the clip carefully.{" "}
          <strong>
            Annotation is done by press and hold the corresponding key on your
            keyboard. For example, if you perceive a gesture, press and hold "1"
            from the moment you witness the gesture until the moment you think
            the gesture finishes.
          </strong>{" "}
        </Text>

        <Text fontSize={"md"}>
          <i>Note:</i> If you are unsure about the exact moment, or if you think
          multiple interpretations are possible, please go with your best guess
          and mark the timestamps as accurately as you can. You can also mark
          multiple annotations for the same participant if you think multiple
          interpretations are possible.
        </Text>
      </div>
    </>
  )
}

export { AnnotationOption, InstructionsSidebar, ParticipantOption }
