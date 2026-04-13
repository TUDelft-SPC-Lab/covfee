import Constants from "Constants"

import { CloseOutlined, InfoCircleFilled } from "@ant-design/icons"
import { Button, Checkbox, Modal, message, notification } from "antd"
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { VideoJsPlayer } from "video.js"
import { nodeContext } from "../../journey/node_context"
import { fetchAnnotator } from "../../models/Journey"
import VideoJSFC from "../../players/videojsfc"
import { TaskExport } from "../../types/node"
import { AllPropsRequired } from "../../types/utils"
import { fetcher } from "../../utils"
import { CovfeeTaskProps } from "../base"

import {
  Button as ButtonChakra,
  Modal as ChakraModal,
  ChakraProvider,
  Image as ImageChakra,
  ModalCloseButton,
  ModalContent,
  ModalOverlay,
} from "@chakra-ui/react"
// import Ingroupgallery_one from "https://covfee.ewi.tudelft.nl/P8wPkLamHiAMOvb29g9h3AFy8tXACT1e/art/session1_cam6_10_2.png"
// import Ingroupgallery_two from "https://covfee.ewi.tudelft.nl/P8wPkLamHiAMOvb29g9h3AFy8tXACT1e/art/session2_cam1_5_2.png"

import { Answer_form_A } from "./answer_form_A"
import {
  ABORT_ONGOING_ANNOTATION_KEY,
  CHANGE_VIEW_NEXT_KEY,
  CHANGE_VIEW_PREV_KEY,
  REGISTER_ACTION_ANNOTATION_KEY,
  TIP_EMOJI,
} from "./constants"
import styles from "./continous_annotation.module.css"
import {
  AnnotationOption,
  InstructionsSidebar,
  ParticipantOption,
} from "./instructions_sidebar"
import { slice } from "./slice"
import type { AnnotationDataSpec, ContinuousAnnotationTaskSpec } from "./spec"
import TaskProgress, { TaskAlreadyCompleted } from "./task_progress"

type GestaltAnnotation = {
  speaker_intention: string
  response: string
  annotation_type?: "A" | "B"
  video_start_time?: number
  video_end_time?: number
}

interface Props extends CovfeeTaskProps<ContinuousAnnotationTaskSpec> {}

const UNINITIALIZED_ACTION_ANNOTATION_START_TIME: null = null
const CAMVIEW_SELECTION_LAYOUT_IS_VERTICAL: boolean = true
const CAMVIEW_SELECTION_NUMBER_OF_VIEWS: number = 5
const VIDEO_PLAYBACK_ASSUMED_FRAMERATE: number = 60.0

/**
 * We specify the data structure for the annotation data received from the server
 */
type AnnotationData = AnnotationDataSpec & {
  id: number
  data_json: number[]
}

type ActionAnnotationDataArray = {
  buffer: number[]
  needs_upload: boolean
}

type Narrative_typeA = {
  created_at: number
  timestamp_start: number
  timestamp_end: number
  intention_description: string
  intention_description_confidence: string | null
  intention_explanation: string
  counterfactual_explanation: string
  intention_explanation_confidence: string | null
  intention_intensity: string | null
  narrative_index: number
}
type Narrative_typeB = {
  created_at: number
  timestamp_start: number
  timestamp_end: number
  intention_description: string
  intention_description_confidence: string | null
  intention_explanation: string
  counterfactual_explanation: string
  intention_explanation_confidence: string | null
  intention_intensity: string | null
  narrative_index: number
}

type Narrative_List = {
  narratives: (Narrative_typeA | Narrative_typeB)[]
  pausedAt: number[]
}

type FreeTextAnswerPayload = {
  narratives?: Narrative_List["narratives"]
  currentNarrativeIndex?: number
}

const ContinuousAnnotationTask: React.FC<Props> = (props) => {
  // Helper function to format timestamps as human-readable with millisecond precision
  const formatTimestamp = () => {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, "0")
    const date = String(now.getDate()).padStart(2, "0")
    const hours = String(now.getHours()).padStart(2, "0")
    const minutes = String(now.getMinutes()).padStart(2, "0")
    const seconds = String(now.getSeconds()).padStart(2, "0")
    const ms = String(now.getMilliseconds()).padStart(3, "0")
    return `${year}-${month}-${date} ${hours}:${minutes}:${seconds}.${ms}`
  }

  const args: AllPropsRequired<Props> = React.useMemo(() => {
    return {
      ...props,
      spec: {
        userCanAdd: true,
        ...props.spec,
      },
    }
  }, [props])

  console.log("Rendering ContinuousAnnotationTask with props:", props)

  const { node } = React.useContext(nodeContext)

  //*************************************************************//
  //------------------ States definition -------------------- //
  //*************************************************************//

  //Purely to help sampling the video clips. remove immediatly
  const [currMediaIndex, setCurrMediaIndex] = useState<number>(0)
  console.log("Videos in spec:", props.spec.media)
  const current_video_src = props.spec.media[currMediaIndex]?.src
  console.log("Current video src:", current_video_src)
  const PARTICIPANT_AUDIO_SRC = props.spec.audioMedia[currMediaIndex].src ?? []

  const nextCurrMediaIndex = (add: number = 1) => {
    const newIndex = currMediaIndex + add
    const clamped = Math.max(0, Math.min(newIndex, props.spec.media.length - 1))
    setCurrMediaIndex(clamped)
    setTaskCompletionPercentage((100 * clamped) / props.spec.media.length)
    props.onUpdateProgress((100 * clamped) / props.spec.media.length)
    setSelectedCamViewIndex(clamped)
  }
  const [answerForm, setAnswerForm] = useState<"A" | "B">(
    props.spec.annotations[currMediaIndex].AB_test ?? "A",
  )
  const [currentNarrativeIndex, setCurrentNarrativeIndex] = useState(0)

  const [gestaltAnnotation, setGestaltAnnotation] = useState<GestaltAnnotation>(
    {
      speaker_intention: "",
      response: "",
      annotation_type: answerForm,
      video_start_time: 0,
      video_end_time: 0,
    },
  )
  //Initialize first narrative based on answer form
  const [narratives, setNarratives] = useState<Narrative_List>(
    answerForm == "A"
      ? {
          narratives: [
            {
              created_at: Date.now(),
              timestamp_start: 0,
              timestamp_end: 0,
              intention_description: "",
              intention_description_confidence: null,
              intention_explanation: "",
              intention_explanation_confidence: null,
              intention_intensity: "",
              counterfactual_explanation: "",
              narrative_index: 0,
            },
          ],
          pausedAt: [],
        }
      : {
          narratives: [
            {
              created_at: Date.now(),
              timestamp_start: 0,
              timestamp_end: 0,
              intention_description: "",
              intention_description_confidence: null,
              intention_explanation: "",
              intention_explanation_confidence: null,
              intention_intensity: "",
              counterfactual_explanation: "",
              narrative_index: 0,
            },
          ],
          pausedAt: [],
        },
  )

  // useEffect(() => {
  //   setGestaltAnnotation({ speaker_intention: "", response: "" })
  // }, [currMediaIndex])

  const setPausedAt = (item: number) => {
    setNarratives((prev) => {
      return {
        narratives: prev.narratives,
        pausedAt: [...prev.pausedAt, item],
      }
    })
  }
  const [noIntentionSeen, setNoIntentionSeen] = useState<boolean>(false)

  const submitFreeTextToServer = async () => {
    for (
      let narrativeIndex = 0;
      narrativeIndex < narratives.narratives.length;
      narrativeIndex++
    ) {
      setCurrentNarrativeIndex(narrativeIndex)
      postFreetextAnswerToServer()
    }
    if (selectedCamViewIndex < props.spec.media.length - 1) {
      setSelectedCamViewIndex(selectedCamViewIndex + 1)
      notification.open({
        message: "Annotation Saved",
        description: "Please continue with the next one.",
        icon: <InfoCircleFilled style={{ color: "green" }} />,
      })
      nextCurrMediaIndex()
      if (currMediaIndex === 15 && answerForm === "A") {
        setShowInitialModal(true)
      }
    } else {
      props.onUpdateProgress(100)
      notification.open({
        message: "All annotations completed!",
        icon: <InfoCircleFilled style={{ color: "green" }} />,
      })
      await submitFinal()
      if (redirectUrl) {
        window.location.href = redirectUrl
      }
    }
  }

  // const PARTICIPANT_AUDIO_SRC = ["https://www.w3schools.com/html/mov_bbb.mp4", "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4"]
  // const PARTICIPANT_AUDIO_SRC = props.spec.audioMedia
  const conversationFloorParticipants = PARTICIPANT_AUDIO_SRC.map(
    (_, index) => index,
  )
  //TODO instead of true turn on for paticipants of current conversation floor sent through props
  const [audioToggles, setAudioToggles] = useState<boolean[]>(
    conversationFloorParticipants.map((index) =>
      [
        ...props.spec.annotations[currMediaIndex].conversation_floor,
        Number(
          props.spec.annotations[currMediaIndex].participant.split("_")[1],
        ),
      ].includes(index + 1),
    ),
  )
  const NextVideoText = (
    <>
      Are you sure you want to continue to the next annotation? <br /> This
      action will bring you to the <strong>next video</strong> and you will not
      be able to return to this one. If you can still think of some intentions
      or have not finished going through the video, please click "Cancel".
    </>
  )
  const BackToProlificText = (
    <>
      Are you sure you want to continue? <br /> This action will bring you to
      the <strong>end of task survey</strong> and you will not be able to return
      to the video annotation. If you can still think of some intentions or have
      not finished going through the video, please click "Cancel".
    </>
  )

  useEffect(() => {
    setAudioToggles(
      conversationFloorParticipants.map((index) =>
        [
          ...props.spec.annotations[currMediaIndex].conversation_floor,
          Number(
            props.spec.annotations[currMediaIndex].participant.split("_")[1],
          ),
        ].includes(index + 1),
      ),
    )
    setNoIntentionSeen(false)
  }, [currMediaIndex])

  const allChecked = audioToggles.every(Boolean)
  const isIndeterminate = audioToggles.some(Boolean) && !allChecked

  const [videoLength, setVideoLength] = useState<{
    server_video_length: number
    client_video_length: number
  } | null>(null)

  const postFreetextAnswerToServer = async (
    payload?: FreeTextAnswerPayload,
  ) => {
    if (!validAnnotationsDataAndSelection) {
      return
    }

    const narrativesToUse = payload?.narratives ?? gestaltAnnotation
    const narrativeIndexToUse = selectedCamViewIndex

    console.log("Posting new data to server", narratives, getCurrentVideoTime())
    const freeText_answer_data_to_post = {
      data_json: [
        narrativesToUse,
        getCurrentVideoTime(),
        Date.now(),
        videoLength,
        narrativeIndexToUse,
      ],
    }

    try {
      const url =
        Constants.base_url +
        node.customApiBase +
        "/annotations/" +
        annotationsDataMirror[selectedCamViewIndex].id
      const res = await fetcher(url, {
        method: "UPDATE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(freeText_answer_data_to_post),
      })
      if (res.ok) {
        fetchAnnotationsServerData()
      } else {
        console.error("Error posting new data:", res.status)
      }
    } catch (error) {
      console.error("Error posting new data:", error)
    }
  }

  //Original state definitions below, new INGroup state definitions above.

  const [submitted, setSubmitted] = useState(args.response.submitted)

  const submitFinal = async () => {
    await props.onSubmit({})
    setSubmitted(true)
    console.log("Final submission completed.")
  }

  React.useEffect(() => {
    setSubmitted(args.response.submitted)
  }, [args.response.submitted])

  const [annotationsDataMirror, setAnnotationsDataMirror] =
    React.useState<AnnotationData[]>()
  // Note: we explicitly IGNORE the Redux setSelectedAnnotationIndex action
  //       set in slice.ts, which appears to stop working as soon as the node
  //       has a finished status when using the covfee custom dispatch function.
  const [selectedAnnotationIndex, setSelectedAnnotationIndex] = useState<
    number | null
  >(null)
  const [showingGallery, setShowingGallery] = useState(false)
  const [showAnnotationTipsOnStart, setShowAnnotationTipsOnStart] =
    useState(true)
  const [showingAnnotationTips, setShowingAnnotationTips] = useState(false)

  const [isAnnotating, setIsAnnotating] = useState(false)
  const [actionAnnotationStartTime, setActionAnnotationStartTime] = useState<
    number | null
  >(UNINITIALIZED_ACTION_ANNOTATION_START_TIME)
  const [selectedCamViewIndex, setSelectedCamViewIndex] = useState(0)
  const [activeAnnotationDataArray, setActiveAnnotationDataArray] =
    React.useState<ActionAnnotationDataArray>({
      buffer: [],
      needs_upload: false,
    })

  const [
    showTaskVariantPopupBulletPoints,
    setShowTaskVariantPopupBulletPoints,
  ] = useState(
    props.spec.taskVariantPopupBulletPoints &&
      props.spec.taskVariantPopupBulletPoints.length > 0,
  )

  const [videoLengthMismatch, setVideoLengthMismatch] = useState(false)
  const [showVideoLengthMismatch, setShowVideoLengthMismatch] = useState(false)
  const [showInitialModal, setShowInitialModal] = useState(true)

  useEffect(() => {
    setGestaltAnnotation((prev) => ({
      ...prev,
      video_start_time: 0,
      video_end_time: 0,
    }))
  }, [currMediaIndex, selectedCamViewIndex])

  const dataJsonContainsAValidAnnotation = (
    data_json: null | object,
  ): boolean => {
    return data_json !== null && Object.keys(data_json).length > 0
  }

  const validAnnotationsDataAndSelection: boolean =
    annotationsDataMirror !== undefined &&
    selectedAnnotationIndex !== null &&
    selectedAnnotationIndex >= 0 &&
    selectedAnnotationIndex < annotationsDataMirror.length

  var isEntireTaskCompleted = false
  var numberOfAnnotationsCompleted = 0
  var numberOfAnnotations = 0

  const [taskCompletionPercentage, setTaskCompletionPercentage] = useState(0)

  const selectFirstAvailableAnnotationIndexBasedOnParticipantName = (
    participant: string,
  ) => {
    if (annotationsDataMirror === undefined) {
      return
    }
    // Finds the first annotation in the spec that has the participant
    const first_annotation_index_for_participant =
      annotationsDataMirror.findIndex((annotation) => {
        return annotation.participant === participant
      })
    if (first_annotation_index_for_participant !== -1) {
      setSelectedAnnotationIndex(first_annotation_index_for_participant)
    }
  }

  //*************************************************************//
  //------------------ Server communication -------------------- //
  //*************************************************************//
  const fetchAnnotationsServerData = React.useCallback(async () => {
    const url =
      Constants.base_url +
      node.customApiBase +
      `/tasks/${node.id}/annotations/all`
    const res = await fetcher(url)
    setAnnotationsDataMirror(await res.json())
  }, [node.customApiBase, node.id])

  // We keep the annotationDataMirror up to date with the server data.
  // Note that given useEffect, this leads to a call immediately when
  // this component is instantiated.
  // Note that fetchAnnotationsServerData is a useCallback, so it is memoized
  // and that function reference is what is being monitored by the useEffect
  React.useEffect(() => {
    fetchAnnotationsServerData()
  }, [fetchAnnotationsServerData])

  const postActiveAnnotationDataArrayToServer = async () => {
    if (!validAnnotationsDataAndSelection) {
      return
    }
    if (!activeAnnotationDataArray.needs_upload) {
      return
    }
    console.log("Posting new data to server", activeAnnotationDataArray)
    const active_annotation_data_to_post = {
      ...annotationsDataMirror[selectedAnnotationIndex],
      data_json: activeAnnotationDataArray.buffer,
    }

    try {
      const url =
        Constants.base_url +
        node.customApiBase +
        "/annotations/" +
        active_annotation_data_to_post.id
      const res = await fetcher(url, {
        method: "UPDATE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(active_annotation_data_to_post),
      })
      if (res.ok) {
        fetchAnnotationsServerData()
      } else {
        console.error("Error posting new data:", res.status)
      }
    } catch (error) {
      console.error("Error posting new data:", error)
    }
    setActiveAnnotationDataArray((prevActiveAnnotationDataArray) => {
      return { ...prevActiveAnnotationDataArray, needs_upload: false }
    })
  }

  // When the activeAnnotationDataArray eventually is observed to have the needs_upload
  // flag set to True, we post the new data to the server
  useEffect(() => {
    if (activeAnnotationDataArray.needs_upload) {
      postActiveAnnotationDataArrayToServer()
      notification.open({
        message: "Annotation Saved",
        description: "Please continue with the next one.",
        icon: <InfoCircleFilled style={{ color: "green" }} />,
      })
    }
  }, [activeAnnotationDataArray])

  // update selectedAnnotationIndex to a reasonable state, for the case in which
  // annotationsDataMirror is undefined, or empty, or when is valid but selectedAnnotationIndex
  // was still uninitialized.
  useEffect(() => {
    if (annotationsDataMirror === undefined) {
      setSelectedAnnotationIndex(null)
    } else if (annotationsDataMirror.length === 0) {
      setSelectedAnnotationIndex(null)
    } else if (selectedAnnotationIndex === null) {
      setSelectedAnnotationIndex(0)
    }
  }, [selectedAnnotationIndex, annotationsDataMirror])

  //*************************************************************//
  //----------- Video playback fuctionality -------------------- //
  //*************************************************************//

  // We get a reference to the VideoJS player and assign event
  // listeners to it.
  const videoPlayerRef = useRef<VideoJsPlayer>(null)
  const audioPlayerRef = useRef
  const [, setIsVideoPlayerReady] = useState(false)
  // We keep track of the loadstart event to make React respond to it
  // based on useEffect calls, because the execution of the loadstart
  // callback is different between chrome and firefox. In Chrome is
  // executed after the useEffect calls (when all state is fully updated),
  // but Firefox executes it before the useEffect calls leading to bugs.
  const [videoLoadStartEvent, setVideoLoadStartEvent] = useState(null)

  const handleVideoPlayerReady = (player: VideoJsPlayer) => {
    videoPlayerRef.current = player
    // We associate a dummy state to trigger a render when the video player is ready
    // and thus execution of the code in the useEffect hook connecting event listeners
    // below.
    setIsVideoPlayerReady(true)
    forceVideoAudioRequirement()
  }

  useEffect(() => {
    if (videoPlayerRef.current) {
      const handleVideoLoadStart = (event: any) => {
        // enqueues a useEffect call
        setVideoLoadStartEvent(event)
        forceVideoAudioRequirement()
      }
      const handleVolumeChange = () => {
        forceVideoAudioRequirement()
      }
      const handleVideoPlay = () => {
        console.log(
          "Video play event detected, setting video_start_time if not set",
          Date.now(),
        )
        setGestaltAnnotation((prev) => {
          if (prev.video_start_time && prev.video_start_time > 0) {
            return prev
          }
          return {
            ...prev,
            video_start_time: formatTimestamp(),
          }
        })
      }
      videoPlayerRef.current.on("ended", handleVideoEnd)
      videoPlayerRef.current.on("loadstart", handleVideoLoadStart)
      videoPlayerRef.current.on("loadeddata", checkVideoLengthWithServer)
      videoPlayerRef.current.on("volumechange", handleVolumeChange)
      videoPlayerRef.current.on("play", handleVideoPlay)
      return () => {
        videoPlayerRef.current.off("ended", handleVideoEnd)
        videoPlayerRef.current.off("loadstart", handleVideoLoadStart)
        videoPlayerRef.current.off("loadeddata", checkVideoLengthWithServer)
        videoPlayerRef.current.off("volumechange", handleVolumeChange)
        videoPlayerRef.current.off("play", handleVideoPlay)
      }
    }
  }) // No dependencies so all functions are updated with all latest state

  useEffect(() => {
    if (videoPlayerRef.current) {
      if (isAnnotating) {
        videoPlayerRef.current.controlBar.hide()
      } else {
        videoPlayerRef.current.controlBar.show()
      }
    }
  }, [isAnnotating])

  const handleVideoEnd = () => {
    console.log("Video ended, handling end of annotation", Date.now())
    handleAnnotationsOnVideoEndEvent()
    setIsAnnotating(false)
    setGestaltAnnotation((prev) => ({
      ...prev,
      video_end_time: formatTimestamp(),
    }))
  }

  // We define the options, more specifically the sources, for the video player
  // Note: it's important to memoize the options object to avoid the videojs player
  //       to be reset on every render, except when the selectedCamViewIndex
  //       does change, which trigger a change in the sources, i.e., the video url
  //       being used.
  const videoPlayerOptions = useMemo(() => {
    let participant = ""
    let source = { ...props.spec.media[selectedCamViewIndex] }
    // we let a plausible participant number to be replaced in the video url
    // just so we don't get errors when things are loading.
    let participant_substr_to_set_to_src_url: string = "1"
    if (validAnnotationsDataAndSelection) {
      // Note: consider optimizing such that if replaceable strings are not
      //       found, then it fallback into not having selectedAnnotationIndex
      //       as a dependency, and thus avoiding the videos from reload.
      participant = annotationsDataMirror[selectedAnnotationIndex].participant
      participant_substr_to_set_to_src_url = participant.replace(
        "Participant_",
        "",
      )
    }
    source.src = source.src.replace(
      "{participant}",
      participant_substr_to_set_to_src_url,
    )
    return {
      autoplay: false,
      controls: true,
      responsive: true,
      fluid: false,
      muted: true,
      sources: [
        {
          src: current_video_src,
          type: "video/mp4",
        },
      ],

      controlBar: {
        volumePanel: false,
        remainingTimeDisplay: false,
      },
    }
  }, [
    props.spec,
    selectedCamViewIndex,
    selectedAnnotationIndex,
    currMediaIndex,
    current_video_src,
  ])

  // ...and add logic that ensures that video playback status is kept in sync under
  // the selectedCamViewIndex changes. First, we keep track of the playback status.
  const [
    playbackStatusOnCamViewChangeEvent,
    setPlaybackStatusOnCamViewChangeEvent,
  ] = useState({
    paused: true,
    currentTime: 0.0,
  })
  useEffect(() => {
    // Note: this is triggered when the selectedCamViewIndex changes
    if (videoPlayerRef.current) {
      setPlaybackStatusOnCamViewChangeEvent({
        paused: videoPlayerRef.current.paused(),
        currentTime: videoPlayerRef.current.currentTime(),
      })
    }
  }, [selectedCamViewIndex, currMediaIndex, current_video_src])

  // ...and then we ensure that the video player is updated with the playback status
  // when the new video source becomes active.
  useEffect(() => {
    if (videoPlayerRef.current) {
      videoPlayerRef.current.currentTime(
        playbackStatusOnCamViewChangeEvent.currentTime,
      )
      if (
        playbackStatusOnCamViewChangeEvent.paused !=
        videoPlayerRef.current.paused()
      ) {
        if (playbackStatusOnCamViewChangeEvent.paused) {
          videoPlayerRef.current.pause()
        } else {
          videoPlayerRef.current.play().catch((error) => {
            console.log("Error playing video: ", error)
          })
        }
      }
    }
  }, [videoLoadStartEvent, currMediaIndex, current_video_src])

  const checkVideoLengthWithServer = async (event: any) => {
    const video_src = videoPlayerRef.current?.src()
    if (!video_src) {
      return
    }

    const video_name_with_extension = video_src.split("/").pop()
    if (!video_name_with_extension) {
      return
    }
    console.log("Checking video length", video_name_with_extension)

    const url =
      Constants.base_url +
      node.customApiBase +
      `/video/${video_name_with_extension}/length`
    const res = await fetcher(url)
    if (!res.ok) {
      console.error("Error fetching video length from server:", res.status)
      setVideoLengthMismatch(true)
      setShowVideoLengthMismatch(true)
      setShowTaskVariantPopupBulletPoints(false)
      return
    }

    const server_video_length = (await res.json())["duration"]
    console.log("Video length from server:", server_video_length)
    const local_vid_duration = videoPlayerRef.current?.duration()
    if (local_vid_duration === undefined) {
      return
    }
    console.log("Video length local:", local_vid_duration)

    setVideoLength({
      server_video_length,
      client_video_length: local_vid_duration,
    })
    // TODO: fix the length mismatch issue, currently we just set it to only care about a 1s mismatch.
    // if (Math.abs(server_video_length - local_vid_duration) > 100) {
    //   setVideoLengthMismatch(true)
    //   setShowVideoLengthMismatch(true)
    //   setShowTaskVariantPopupBulletPoints(false)
    // } else {
    //   setVideoLengthMismatch(false)
    //   setShowVideoLengthMismatch(false)
    // }
  }

  const forceVideoAudioRequirement = () => {
    if (!videoPlayerRef.current || props.spec.audioRequirement === null) {
      return
    }

    if (props.spec.audioRequirement) {
      if (
        videoPlayerRef.current.volume() !== 1 ||
        videoPlayerRef.current.muted()
      ) {
        videoPlayerRef.current.volume(1)
        videoPlayerRef.current.muted(true) //remember to change this back to false and mute video in the specs instead
      }
    } else {
      if (videoPlayerRef.current.volume() !== 0) {
        videoPlayerRef.current.volume(0)
        videoPlayerRef.current.muted(true)
      }
    }
  }

  const numberOfVideoFrames = () => {
    if (videoPlayerRef.current) {
      return Math.round(
        videoPlayerRef.current.duration() * getCurrentVideoFramerate(),
      )
    } else {
      return 0
    }
  }

  const startVideoPlayback = (startTimeInSeconds: number) => {
    if (videoPlayerRef.current) {
      videoPlayerRef.current.currentTime(startTimeInSeconds)
      videoPlayerRef.current.play()
    }
  }

  const pauseVideoPlayback = () => {
    if (videoPlayerRef.current) {
      videoPlayerRef.current.pause()
    }
  }

  const getCurrentVideoTime = () => {
    if (videoPlayerRef.current) {
      return videoPlayerRef.current.currentTime()
    } else {
      return 0.0
    }
  }

  const getCurrentVideoFramerate = () => {
    if (videoPlayerRef.current) {
      return (
        videoPlayerRef.current.playbackRate() * VIDEO_PLAYBACK_ASSUMED_FRAMERATE
      )
    } else {
      return VIDEO_PLAYBACK_ASSUMED_FRAMERATE
    }
  }

  //********************************************************************//
  //------------- Participant and annnotation menus-------------------- //
  //********************************************************************//

  const participantCompleted = (participant: string) => {
    if (annotationsDataMirror === undefined) {
      return false
    }
    const participant_annotations = annotationsDataMirror.filter(
      (annotation) => annotation.participant === participant,
    )
    return participant_annotations.every((annotation) =>
      dataJsonContainsAValidAnnotation(annotation.data_json),
    )
  }

  const annotationCompleted = (index: number) => {
    if (annotationsDataMirror === undefined) {
      return false
    }
    return dataJsonContainsAValidAnnotation(
      annotationsDataMirror[index].data_json,
    )
  }

  //********************************************************************//
  //----------------- Action annotation logic ------------------------- //
  //********************************************************************//
  const annotateStartEventOfActionAnnotation = () => {
    // If there isn't an ongoing annotation already... (note that
    // holding the key leads to multiple event calls)
    if (
      actionAnnotationStartTime === UNINITIALIZED_ACTION_ANNOTATION_START_TIME
    ) {
      const currentVideoTime = getCurrentVideoTime()
      setActionAnnotationStartTime(currentVideoTime)
    }
  }

  const annotateEndEventOfActionAnnotation = () => {
    // If we are annotating, we set the activeAnnotationDataArray to 1 for the
    // corresponding time range
    if (
      actionAnnotationStartTime !== UNINITIALIZED_ACTION_ANNOTATION_START_TIME
    ) {
      const currentVideoTime = getCurrentVideoTime()
      console.log("Annotation ended at", currentVideoTime)
      const currentVideoFramerate = getCurrentVideoFramerate()
      // Based on the registered annotation start time and framerate, we get
      // the corresponding frame time.
      const startFrameIndex = Math.round(
        actionAnnotationStartTime * currentVideoFramerate,
      )
      // Similarly, we retrieve the current frame number
      const endFrameIndex = Math.min(
        Math.round(currentVideoTime * currentVideoFramerate),
        activeAnnotationDataArray.buffer.length,
      )
      // We then update the data array for the elements in between start and end time
      if (
        startFrameIndex < activeAnnotationDataArray.buffer.length &&
        endFrameIndex > startFrameIndex
      ) {
        setActiveAnnotationDataArray((prevActiveAnnotationDataArray) => {
          const newActiveAnnotationDataArray =
            prevActiveAnnotationDataArray.buffer.slice()
          newActiveAnnotationDataArray.fill(1, startFrameIndex, endFrameIndex)
          return {
            buffer: newActiveAnnotationDataArray,
            needs_upload: prevActiveAnnotationDataArray.needs_upload,
          }
        })
      }
      // We clear out annotation start time
      setActionAnnotationStartTime(UNINITIALIZED_ACTION_ANNOTATION_START_TIME)
    }
  }

  const handleAnnotationStartOrStopButtonClick = () => {
    if (!isAnnotating) {
      if (!validAnnotationsDataAndSelection) {
        return
      }
      let new_buffer: number[] = Array.from(
        { length: numberOfVideoFrames() },
        () => 0,
      )

      if (new_buffer.length === 0) {
        // This is the result of failure to load the video.
        message.error(
          "There was an error loading the video. Please refresh the page and try again.",
        )
        return
      }

      // Scroll to the top of the page,
      // on 1080p resolution it doesn't do anything, as the page is as big as the screen,
      // on 720p or lower, the page is bigger than the screen, so it scrolls to the top.
      const parentElement = document.getElementById("JourneyContentContainer")
      parentElement.scrollTo({ top: 0, left: 0, behavior: "instant" })

      startVideoPlayback(0.0)

      setActiveAnnotationDataArray({
        buffer: new_buffer,
        needs_upload: false,
      })
    } else {
      pauseVideoPlayback()
    }
    setIsAnnotating(!isAnnotating)
  }

  const handleAnnotationsOnVideoEndEvent = () => {
    if (isAnnotating) {
      // TODO: Triple check that isAnnotating is not being set to false before this
      // function is called.
      annotateEndEventOfActionAnnotation()
      // Setting the need_upload will trigger the postActiveAnnotationDataArrayToServer
      // function given the useEffect hook with activeAnnotationDataArray as dependency
      setActiveAnnotationDataArray((prevActiveAnnotationDataArray) => {
        return { ...prevActiveAnnotationDataArray, needs_upload: true }
      })
    } else {
      console.log("Annotating is false")
    }
  }

  const handleParticipantNotAppearingInVideos = () => {
    // FIXME: Extend this logic to push all annotations categories
    // associated to the selected participant as empty, not just the current one.
    setActiveAnnotationDataArray({
      buffer: Array.from({ length: 1 }, () => 0),
      needs_upload: true,
    })
  }

  //********************************************************************//
  //---------- Keyboard management for Action annotation--------------- //
  //********************************************************************//
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key.toUpperCase() === REGISTER_ACTION_ANNOTATION_KEY) {
        annotateStartEventOfActionAnnotation()
      }
      if (isAnnotating && event.key === ABORT_ONGOING_ANNOTATION_KEY) {
        handleAnnotationStartOrStopButtonClick()
      }
    },
    [actionAnnotationStartTime, getCurrentVideoTime, isAnnotating],
  )

  const handleKeyUp = useCallback(
    (event: KeyboardEvent) => {
      if (event.key.toUpperCase() === REGISTER_ACTION_ANNOTATION_KEY) {
        annotateEndEventOfActionAnnotation()
      }
      // We use the arrow keys to change the selected camera view
      // FIXME: this leads to scrolling the page. However, we expect that the final
      // implementation will have a layout which won't generate a scrollbar while
      // annotating.
      if (event.key.toUpperCase() == CHANGE_VIEW_PREV_KEY) {
        setSelectedCamViewIndex((prevSelectedViewIndex) => {
          return Math.max(0, prevSelectedViewIndex - 1)
        })
      }
      if (event.key.toUpperCase() == CHANGE_VIEW_NEXT_KEY) {
        setSelectedCamViewIndex((prevSelectedViewIndex) => {
          return Math.min(4, prevSelectedViewIndex + 1)
        })
      }
    },
    [isAnnotating, annotateEndEventOfActionAnnotation],
  )

  // Register the listeners for keyboard events
  // React.useEffect(() => {
  //   window.addEventListener("keydown", handleKeyDown)
  //   window.addEventListener("keyup", handleKeyUp)
  //   return () => {
  //     window.removeEventListener("keydown", handleKeyDown)
  //     window.removeEventListener("keyup", handleKeyUp)
  //   }
  // }, [handleKeyDown, handleKeyUp])

  //********************************************************************//
  // Participant and annotations for participant options

  let participant_options: ParticipantOption[] = []
  let annotation_options: AnnotationOption[] = []
  if (validAnnotationsDataAndSelection) {
    participant_options = annotationsDataMirror
      // We filter unique ocurrences of participants
      .filter(
        (annotation, index, self) =>
          index ===
          self
            .map((self_annotation) => self_annotation.participant)
            .indexOf(annotation.participant),
      )
      // Those unique occurrences are then mapped into menu items
      .map(({ participant }) => ({
        name: participant,
        completed: participantCompleted(participant),
      }))

    annotation_options = annotationsDataMirror
      // We extend the annotationDataMirror with the index for element
      .map((annotation, annotation_index) => ({
        annotation,
        annotation_index,
      }))
      // We pick the annotations for the currently selected participant (forwarding the original index)
      .filter(
        ({ annotation, annotation_index }) =>
          annotation.participant ===
          annotationsDataMirror[selectedAnnotationIndex].participant,
      )
      // Now we transform those into entries for the menu, using the original index as unique identifier (key)
      .map(({ annotation, annotation_index }) => ({
        category: annotation.category,
        index: annotation_index,
        completed: annotationCompleted(annotation_index),
      }))
  }

  React.useEffect(() => {
    setShowingAnnotationTips(isAnnotating && showAnnotationTipsOnStart)
  }, [isAnnotating])

  const [annotatorMeta, setAnnotatorMeta] = useState({
    prolificPid: "",
    studyId: "",
    hit_global_unique_id: "",
  })

  useEffect(() => {
    let mounted = true

    fetchAnnotator(node.journey_id)
      .then((payload) => {
        if (!mounted || Object.keys(payload).length === 0) {
          return
        }

        console.log(
          `loaded prolific id ${payload.prolific_pid}, ` +
            `study id ${payload.prolific_study_id}, ` +
            `hit global unique id ${payload.hit_global_unique_id}`,
        )

        setAnnotatorMeta({
          prolificPid: payload.prolific_pid ?? "",
          studyId: payload.prolific_study_id ?? "",
          hit_global_unique_id: payload.hit_global_unique_id ?? "",
        })
      })
      .catch((error) => {
        console.error("Failed to fetch annotator data:", error)
      })

    return () => {
      mounted = false
    }
  }, [node.journey_id])

  // ********************************************************************//
  //----------------------- JSX rendering logic ------------------------//
  //********************************************************************//
  if (!validAnnotationsDataAndSelection) {
    // We assume that a first selection is done automatically and that the user
    // can't get the component into a state in which there is no valid selection.
    return <h1>Loading...</h1>
  }

  // Redirection URL once the annotator has completed the entire annotation task.
  const { prolificPid, studyId, hit_global_unique_id } = annotatorMeta

  const redirectUrl =
    "https://greenwichuniversity.eu.qualtrics.com/jfe/form/SV_1IhZTEderDn23pY?" +
    "CC=" +
    encodeURIComponent(props.spec.prolificCompletionCode) +
    "&PROLIFIC_PID=" +
    encodeURIComponent(prolificPid) +
    "&STUDY_ID=" +
    encodeURIComponent(studyId) +
    "&HIT_GLOBAL_ID=" +
    encodeURIComponent(hit_global_unique_id)

  if (args.response.submitted && isEntireTaskCompleted) {
    return <TaskAlreadyCompleted redirectUrl={redirectUrl} />
  }

  return (
    <ChakraProvider>
      <form>
        {/* {showTaskVariantPopupBulletPoints && (
        <Modal
          title={"Task overview"}
          open={showTaskVariantPopupBulletPoints}
          footer={[
            <Button
              key="submit"
              type="primary"
              onClick={() => {
                setShowTaskVariantPopupBulletPoints(false)
              }}
            >
              Ok
            </Button>,
          ]}
        >
          {props.spec.taskVariantPopupBulletPoints && (
            <ul>
              {props.spec.taskVariantPopupBulletPoints.map(
                (instruction: string, index: number) => (
                  <li key={index}>{instruction}</li>
                )
              )}
            </ul>
          )}
        </Modal>
      )} */}
        {showVideoLengthMismatch && (
          <Modal
            title={"Video length error"}
            open={showVideoLengthMismatch}
            closable={false}
            footer={[
              <Button
                key="submit"
                type="primary"
                onClick={() => window.location.reload()}
              >
                Reload page
              </Button>,
            ]}
          >
            <p>
              Annotation is not possible. Please reload the page. If that
              doesn't work, update your browser or try with a different one
              (Chrome).
            </p>
          </Modal>
        )}
        <ChakraModal
          isOpen={showInitialModal}
          onClose={() => setShowInitialModal(false)}
          isCentered
          size="lg"
        >
          <ModalOverlay />
          <ModalContent>
            <ModalCloseButton />
            <div style={{ padding: "40px", textAlign: "center" }}>
              {currMediaIndex < 15 && answerForm === "A" ? (
                <h2 style={{ marginBottom: "20px" }}>
                  Welcome to the Annotation Task
                </h2>
              ) : (
                <h2 style={{ marginBottom: "20px" }}>
                  Welcome to the Annotation Task Part 2
                </h2>
              )}
              <p style={{ marginBottom: "30px" }}>
                In the following videos, you will watch an interaction. First,
                you will be given some context. Then, you will watch a
                progressively given utterance. For this utterance, think of the
                following question, even if it’s still incomplete:
              </p>
              <p>What is the intended social action of the (last) speaker?</p>
              <p>What actions could the other side take as a response?</p>
              <p>Make your best guess if you're uncertain.</p>
              <ButtonChakra
                colorScheme="blue"
                onClick={() => setShowInitialModal(false)}
              >
                Continue
              </ButtonChakra>
            </div>
          </ModalContent>
        </ChakraModal>
        <ChakraModal
          isOpen={showingGallery}
          onClose={() => setShowingGallery(false)}
          size="full"
        >
          <ModalOverlay bg="blackAlpha.800" />

          <ModalContent
            bg="transparent"
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <ModalCloseButton color="white" size="lg" zIndex={2} />

            <ImageChakra
              boxSize="80%"
              src={
                "https://covfee.ewi.tudelft.nl/P8wPkLamHiAMOvb29g9h3AFy8tXACT1e/art/session1_cam6_10_2.png"
              }
            />
            <ImageChakra
              boxSize="80%"
              src={
                "https://covfee.ewi.tudelft.nl/P8wPkLamHiAMOvb29g9h3AFy8tXACT1e/art/session2_cam1_5_2.png"
              }
            />
          </ModalContent>
        </ChakraModal>
        <div className={styles["action-annotation-task"]}>
          <div
            className={`${styles["sidebar"]} ${styles["left-sidebar"]} ${
              isAnnotating ? styles["left-sidebar-hidden"] : ""
            }`}
          >
            <TaskProgress
              finished={isEntireTaskCompleted}
              percent={taskCompletionPercentage}
              completionCode={props.spec.prolificCompletionCode}
              redirectUrl={redirectUrl}
              onSubmit={submitFinal}
              submitButtonDisabled={submitted}
            />

            <InstructionsSidebar
              // Current content to display
              selected_participant={Number(
                props.spec.annotations[currMediaIndex].participant.split(
                  "_",
                )[1],
              )}
              selected_annotation={{
                category:
                  annotationsDataMirror[selectedAnnotationIndex].category,
                completed: annotationCompleted(selectedAnnotationIndex),
              }}
              participant_options={participant_options}
              annotation_options={annotation_options}
              video_tutorial_url={props.spec.videoTutorialUrl}
              // Callbacks
              onCantFindParticipant={handleParticipantNotAppearingInVideos}
              onParticipantSelected={(participant: string) => {
                selectFirstAvailableAnnotationIndexBasedOnParticipantName(
                  participant,
                )
              }}
              onAnnotationSelected={(index: number) => {
                setSelectedAnnotationIndex(index)
              }}
              onStartStopAnnotationClick={
                handleAnnotationStartOrStopButtonClick
              }
              onOpenParticipantSelectionClick={() => {
                setShowingGallery(true)
              }}
              onWatchTutorialVideoClick={() => {
                setShowTaskVariantPopupBulletPoints(true)
              }}
              answerForm={answerForm}
              mediaIndex={currMediaIndex}
            />
          </div>
          <div style={{ backgroundColor: "blue" }} /> {/* <--- Filler div */}
          <div className={styles["main-content"]}>
            <div className={styles["main-content-video-and-guide"]}>
              <div className={styles["video-player-container"]}>
                <VideoJSFC
                  options={videoPlayerOptions}
                  audioSrc={PARTICIPANT_AUDIO_SRC}
                  audioToggles={audioToggles}
                  onReady={handleVideoPlayerReady}
                  onPausedAt={setPausedAt}
                  answerForm={answerForm}
                />
              </div>

              {showingAnnotationTips && (
                <div className={styles["instructions-box-overlay"]}>
                  {/* These are the tips we want to make sure the annotator sees while the annotation process is ongoing */}
                  <Button
                    type="text"
                    icon={<CloseOutlined style={{ color: "white" }} />}
                    style={{ position: "absolute", top: 0, right: 0 }}
                    onClick={() => {
                      setShowingAnnotationTips(false)
                    }}
                  />
                  <h2 className={styles["instruction-text-during-annotation"]}>
                    {TIP_EMOJI} Press ESC to abort the ongoing annotation. Don't
                    worry you can start over.
                  </h2>
                  <h2 className={styles["instruction-text-during-annotation"]}>
                    {TIP_EMOJI} Press {CHANGE_VIEW_PREV_KEY.toUpperCase()} or{" "}
                    {CHANGE_VIEW_NEXT_KEY.toUpperCase()} to change camera if the
                    participant of interest moves out of view.
                  </h2>

                  <Checkbox
                    style={{
                      color: "white",
                      fontSize: "1rem",
                      position: "absolute",
                      bottom: 0,
                      right: 0,
                    }}
                    onChange={(e) =>
                      setShowAnnotationTipsOnStart(!e.target.checked)
                    }
                  >
                    Don't show this again
                  </Checkbox>
                </div>
              )}
            </div>
            <div>
              {answerForm === "A" && (
                <Answer_form_A
                  videoLengthMismatch={videoLengthMismatch}
                  gestaltAnnotation={gestaltAnnotation}
                  setGestaltAnnotation={setGestaltAnnotation}
                  postFreetextAnswerToServer={postFreetextAnswerToServer}
                  submitFreeTextToServer={submitFreeTextToServer}
                  noIntentionSeen={noIntentionSeen}
                  setNoIntentionSeen={(value) => setNoIntentionSeen(value)}
                  getCurrentPausedTime={() =>
                    Number(
                      Number(
                        videoPlayerRef.current?.currentTime() ?? 0,
                      ).toFixed(2),
                    )
                  }
                />
              )}
              {answerForm === "B" && (
                <ButtonChakra
                  mt="10px"
                  colorScheme="blue"
                  onClick={submitFreeTextToServer}
                >
                  Submit Annotation
                </ButtonChakra>
              )}
            </div>
          </div>
        </div>
      </form>
    </ChakraProvider>
  )
}

export default {
  taskComponent: ContinuousAnnotationTask,
  taskSlice: slice,
  useSharedState: false,
} as TaskExport
