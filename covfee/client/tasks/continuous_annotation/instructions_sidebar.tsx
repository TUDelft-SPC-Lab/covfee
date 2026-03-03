import type { MenuProps } from "antd"
import { MenuInfo, Modal } from "antd"
import React, { useEffect, useState } from "react"

import {
  BorderOutlined,
  CheckSquareTwoTone
} from "@ant-design/icons"


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
  selected_participant: ParticipantOption
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
        {props.answerForm === "A" && (<>
        <Text fontSize={"md"}><strong>Welcome!</strong> In this task, you will watch a short video clip (30 seconds). Your goal is to identify the <strong>intentions</strong> of the participant (shown below) as they happen.</Text>
        <Participant_image participant_id={["13"]}/>
        </>)
        }
        {props.answerForm === "B" &&
        <>
        <Text fontSize={"md"}><strong>Welcome!</strong> In this task, you will watch a short video clip (30 seconds). Your goal is to identify the <strong>intentions</strong> of the participants (shown below) as they happen and explain why.</Text>
        <Participant_image participant_id={["13"]}/>
        <Text fontSize={"md"}>An intention is a thought and subsequent planning behavior to ensure their intention is successfully realised. Try to use your thoughts about their beliefs and desires as part of your explanation. Beliefs are what the participant thinks are true about the situation. Desires are goals of the participant.</Text>
        <Text fontSize={"md"}>To help construct your explanation, here are some tips that might help.</Text>
        <OrderedList fontSize="md" pl="20px" spacing={2}>
          <ListItem>
            <strong>Cues:</strong> Physical objects or cues (e.g., a person looking at their watch, a loud noise, a sofa, a book, a specific location like a "kitchen"). 
          </ListItem>
          <ListItem>
            <strong>Characteristics:</strong> How would you describe the vibe of the situation? (e.g., is it "tense," "casual," “boring”, or "pleasant"?). 
          </ListItem>
          <ListItem>
            <strong>Category:</strong> What "type" of situation do they think they are in? (e.g., “changing lanes on the motorway” vs “interaction at zebra crossing” vs. “driving in a pedestrianised area”). 
          </ListItem>
          <ListItem>
            <strong>Social Scripts:</strong> These are mental "how-to" guides or roadmaps for how an interaction is supposed to go, possibly based on the category. These can be defined by a situation e.g. in the fine dining industry, customers need to wait for a waiter to come and take their order at their table. That is an externalised script. For a customer who has only eaten at fast food restaurants and goes to a fine dining restaurant for the first time might expect the food orders to be made at the kitchen counter. That is an internal script. 
          </ListItem>
        </OrderedList>
        </>
        }

        <Text fontSize={"md"} marginBottom={"5px"}><strong>1. Watch and pause:</strong> Please watch the clip carefully. <strong>Pause the clip as soon as you witness what you perceive to be an intention.</strong> </Text>
        <Text fontSize={"md"}><i>Note:</i> It is natural to take a few seconds to process what you see; if you pause slightly after the moment, please use the timestamp adjustment tool to mark the exact start and end of the intention.</Text>
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
        <Text fontSize={"md"}>To select a precise moment, adjust the video using the progress bar, then click the appropriate button.</Text>
        <Text fontSize={"md"}>Make sure both a start and end time are provided.</Text>
        <Text fontSize={"md"}><strong>3. Multiple Intentions: </strong>If you believe the participant is acting on multiple intentions at once, or if several interpretations are possible, click the "+" to fill out a separate set of questions for each.</Text>
        <Text fontSize={"md"}><strong>4. Fill in the questionaire under the video: </strong>There is no right answer, just your honest interpretation.</Text>
      </div>
    </>
  )
}

export { AnnotationOption, InstructionsSidebar, ParticipantOption }
