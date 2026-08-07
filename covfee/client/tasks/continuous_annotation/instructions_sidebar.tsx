import type { MenuProps } from "antd"
import { MenuInfo, Modal } from "antd"
import React, { useEffect, useState } from "react"

import { BorderOutlined, CheckSquareTwoTone } from "@ant-design/icons"

import { OrderedList } from "@chakra-ui/react"
import styles from "./continous_annotation.module.css"

type ParticipantOption = {
  name: string
  completed: boolean
}

type AnnotationOption = {
  category: string
  index?: number
  completed: boolean
}

type AnswerForm = "A" | "B"
type InstructionVariant =
  | "section-one-form-a"
  | "section-one-form-b"
  | "section-two-form-a"
  | "section-two-form-b"

type Props = {
  selected_participant: number
  selected_annotation: AnnotationOption
  participant_options: ParticipantOption[]
  annotation_options: AnnotationOption[]
  video_tutorial_url?: string
  answerForm: AnswerForm
  mediaIndex: number
  batchItemId?: number
  sectionOneItemCount?: number

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

  const sectionItemId = props.batchItemId ?? props.mediaIndex
  const sectionOneItemCount =
    props.sectionOneItemCount ?? (props.answerForm === "A" ? 15 : 30)
  const instructionVariant: InstructionVariant =
    sectionItemId < sectionOneItemCount
      ? props.answerForm === "A"
        ? "section-one-form-a"
        : "section-one-form-b"
      : props.answerForm === "A"
      ? "section-two-form-a"
      : "section-two-form-b"

  const renderSectionOneFormAInstructions = () => (
    <div className={styles["sidebar-block"]}>
      <h1>Instructions</h1>
      <h2 style={{ marginBottom: "20px" }}>
        Welcome to the GesBench Annotation Task 1 Section 1 of 2
      </h2>
      <p>
        In the following video, you will see an utterance. Think of the
        following question, even if the utterance is incomplete, and then
        provide the answer:
      </p>
      <OrderedList style={{ marginBottom: "30px" }}>
        <li>What is the intended social action of the speaker?</li>
        <li>What actions could the other side take as a response?</li>
      </OrderedList>
      <p>Make your best guess if you're uncertain.</p>
      <p>After you finish typing, click "Submit Annotation" button to proceed.</p>
    </div>
  )

  const renderSectionTwoFormAInstructions = () => (
    <div className={styles["sidebar-block"]}>
      <h1>Instructions</h1>
      <h2 style={{ marginBottom: "20px" }}>
        Welcome to the GesBench Annotation Task 1 Section 2 of 2
      </h2>
      <p>
        In the following video, you will see an interaction. Think of the
        following question with regard to the <strong>last utterance</strong>{" "}
        you see (and its speaker), even if it's incomplete, and then provide the
        answer:
      </p>
      <OrderedList style={{ marginBottom: "30px" }}>
        <li>What is the intended social action of the <strong>last</strong>{" "}
          speaker?</li>
        <li>What actions could the other side take as a response?</li>
      </OrderedList>
      <p>Make your best guess if you're uncertain.</p>
      <p>After you finish typing, click "Submit Annotation" button to proceed.</p>
    </div>
  )

  const renderSectionOneFormBInstructions = () => (
    <div className={styles["sidebar-block"]}>
      <h1>Instructions</h1>
      <h2 style={{ marginBottom: "20px" }}>
        Welcome to the GesBench Annotation Task 2 Section 1 of 2
      </h2>
      <p style={{ marginBottom: "30px" }}>
        In the following video, you will see an utterance. Think of the
        following question when you watch the video:
      </p>
      <OrderedList style={{ marginBottom: "30px" }}>
        <li>
          What is the intended social action of the speaker?
        </li>
        <li>What actions could the other side(s) take as a response?</li>
      </OrderedList>
      <p>Make your best guess if you're uncertain.</p>
      <p><strong>You don't need to submit any text in this section. Click "Submit Annotation" button to proceed to next video.</strong></p>
      <p><strong>There is no playback option in this task, so be sure you focus on the video as you watch it.</strong></p>
    </div>
  )

  const renderSectionTwoFormBInstructions = () => (
    <div className={styles["sidebar-block"]}>
      <h1>Instructions</h1>
      <h2 style={{ marginBottom: "20px" }}>
        Welcome to the GesBench Annotation Task 2 Section 2 of 2
      </h2>
      <p style={{ marginBottom: "30px" }}>
        In the following video, you will see an interaction. Think of the
        following question with regard to the <strong>last utterance</strong>{" "}
        you see (and its speaker):
      </p>
      <OrderedList style={{ marginBottom: "30px" }}>
        <li>
          What is the intended social action of the <strong>last</strong>{" "}
          speaker?
        </li>
        <li>What actions could the other side take as a response?</li>
      </OrderedList>
      <p>Make your best guess if you're uncertain.</p>
      <p><strong>You don't need to submit any text in this section. Click "Submit Annotation" button to proceed to next video.</strong></p>
      <p><strong>There is no playback option in this task, so be sure you focus on the video as you watch it.</strong></p>
    </div>
  )

  const renderInstructions = () => {
    switch (instructionVariant) {
      case "section-one-form-a":
        return renderSectionOneFormAInstructions()
      case "section-one-form-b":
        return renderSectionOneFormBInstructions()
      case "section-two-form-a":
        return renderSectionTwoFormAInstructions()
      case "section-two-form-b":
        return renderSectionTwoFormBInstructions()
    }
  }

  return <>{renderInstructions()}</>
}

export { AnnotationOption, InstructionsSidebar, ParticipantOption }
