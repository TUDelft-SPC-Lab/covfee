import * as openvidu from "openvidu-browser"
import * as React from "react"
import { useEffect } from "react"
import { CovfeeTaskProps } from "../base"

import { slice } from "./slice"
import type { VideocallTaskSpec } from "./spec"

import { nodeContext } from "../../journey/node_context"
import { TaskExport } from "../../types/node"
import { AllPropsRequired } from "../../types/utils"
import { VideocallGUI } from "./gui"

interface Props extends CovfeeTaskProps<VideocallTaskSpec> {
  taskData: {
    session_id: string
    connection_token: string
  }
}

export const VideocallTask: React.FC<Props> = (props) => {
  const args: AllPropsRequired<Props> = React.useMemo(
    () => ({
      spec: {
        muted: false,
        videoOff: false,
        ...props.spec,
      },
      ...props,
    }),
    [props]
  )

  // const OV = React.useRef(new openvidu.OpenVidu())
  const [OV, setOV] = React.useState(new openvidu.OpenVidu())
  const [session, setSession] = React.useState<openvidu.Session>(null)
  const [publisher, setPublisher] = React.useState<openvidu.Publisher>(null)
  const [subscribers, setSubscribers] = React.useState<openvidu.Subscriber[]>(
    []
  )
  const [currentVideoDevice, setCurrentVideoDevice] =
    React.useState<openvidu.Device>(null)

  const [muted, setMuted] = React.useState(false)
  const [videoStopped, setStopVideo] = React.useState(false)
  const { paused, disabled } = React.useContext(nodeContext)

  const makePublisher = React.useCallback(async () => {
    if (disabled)
      return console.warn(
        "publishStream called when disabled = True. Nothing will be done"
      )

    console.log("Publishing stream..")
    console.log(disabled)
    // --- 5) Get your own camera stream ---
    // Init a publisher passing undefined as targetElement (we don't want OpenVidu to insert a video
    // element: we will manage it on our own) and with the desired properties
    let _publisher = await OV.initPublisherAsync(undefined, {
      audioSource: undefined, // The source of audio. If undefined default microphone
      videoSource: undefined, // The source of video. If undefined default webcam
      publishAudio: !args.spec.muted, // Whether you want to start publishing with your audio unmuted or not
      publishVideo: !args.spec.videoOff, // Whether you want to start publishing with your video enabled or not
      resolution: "640x480", // The resolution of your video
      frameRate: 30, // The frame rate of your video
      insertMode: "APPEND", // How the video is inserted in the target element 'video-container'
      mirror: false, // Whether to mirror your local video or not
    })

    // --- 6) Publish your stream ---

    // Obtain the current video device in use
    var devices = await OV.getDevices()
    var videoDevices = devices.filter((device) => device.kind === "videoinput")
    var currentVideoDeviceId = _publisher.stream
      .getMediaStream()
      .getVideoTracks()[0]
      .getSettings().deviceId
    var _currentVideoDevice = videoDevices.find(
      (device) => device.deviceId === currentVideoDeviceId
    )

    // Set the main video in the page to display our webcam and store our Publisher
    setCurrentVideoDevice(_currentVideoDevice)
    setPublisher(_publisher)

    return _publisher
  }, [OV, args.spec.muted, args.spec.videoOff, disabled])

  const leaveSession = React.useCallback(() => {
    // --- 7) Leave the session by calling 'disconnect' method over the Session object ---
    // Empty all properties...
    setSession((session) => {
      if (session) {
        session.disconnect()
      }
      return null
    })
    setSubscribers([])
  }, [])

  useEffect(() => {
    // takes care of leaving the session when the user closes the tab.
    // this is not called by the effect's cleanup fn
    window.addEventListener("beforeunload", leaveSession)

    return () => {
      window.removeEventListener("beforeunload", leaveSession)
    }
  })

  /**
   * Here we create the session object and
   * store it in state
   */
  React.useEffect(() => {
    if (session !== null) return

    console.log("OV.initSession()")

    const sess = OV.initSession()

    // On every new Stream received...
    sess.on("streamCreated", (event) => {
      console.log("ON: streamCreated")
      // Subscribe to the Stream to receive it. Second parameter is undefined
      // so OpenVidu doesn't create an HTML video by its own
      var subscriber = sess.subscribe(event.stream, undefined)

      // Update the state with the new subscribers
      setSubscribers((subscribers) => [...subscribers, subscriber])
    })

    // On every Stream destroyed...
    sess.on("streamDestroyed", (event) => {
      setSubscribers((subscribers) =>
        subscribers.filter((s) => s != event.stream.streamManager)
      )
    })

    // On every asynchronous exception...
    sess.on("exception", (exception) => {
      console.warn(exception)
    })

    setSession(sess)
  }, [
    OV,
    args.spec.muted,
    args.spec.videoOff,
    args.taskData.connection_token,
    makePublisher,
    session,
  ])

  /**
   * When the session is set
   * we call connect and publish our stream
   */
  React.useEffect(() => {
    if (session === null) return

    console.log(`OV: connecting with token: ${args.taskData.connection_token}`)
    session
      .connect(args.taskData.connection_token, {})
      .then(makePublisher)
      // .then((publisher) => {
      //   if (publisher) session.publish(publisher)
      // })
      .catch((error) => {
        console.error(
          "There was an error connecting to the session:",
          error.code,
          error.message
        )
      })
  }, [args.taskData.connection_token, makePublisher, session])

  // unpublish when the task is paused
  React.useEffect(() => {
    if (!publisher || !session) return

    if (!paused) {
      session.publish(publisher)
      return () => {
        session.unpublish(publisher)
      }
    }
  }, [paused, publisher, session])

  React.useEffect(() => {
    return () => {
      leaveSession()
    }
  }, [leaveSession])

  const toggleMuted = () => {
    console.log("toggleMuted")
    setMuted((muted) => {
      publisher.publishAudio(!!muted)
      return !muted
    })
  }

  const toggleVideo = () => {
    setStopVideo((videoStopped) => {
      publisher.publishVideo(!!videoStopped)
      return !videoStopped
    })
  }

  const switchCamera = async () => {
    try {
      const devices = await OV.getDevices()
      var videoDevices = devices.filter(
        (device) => device.kind === "videoinput"
      )

      if (videoDevices && videoDevices.length > 1) {
        var newVideoDevice = videoDevices.filter(
          (device) => device.deviceId !== currentVideoDevice.deviceId
        )

        if (newVideoDevice.length > 0) {
          // Creating a new publisher with specific videoSource
          // In mobile devices the default and first camera is the front one
          var newPublisher = OV.initPublisher(undefined, {
            videoSource: newVideoDevice[0].deviceId,
            publishAudio: true,
            publishVideo: true,
            mirror: true,
          })

          //newPublisher.once("accessAllowed", () => {
          await session.unpublish(publisher)
          await session.publish(newPublisher)

          setPublisher(newPublisher)
          setCurrentVideoDevice(newVideoDevice[0])
        }
      }
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <VideocallGUI
      subscribers={subscribers.map((s) => s.addVideoElement.bind(s))}
      clientSubscriber={
        publisher ? publisher.addVideoElement.bind(publisher) : null
      }
      disabled={disabled}
      muted={muted}
      videoStopped={videoStopped}
      onMute={toggleMuted}
      onStopVideo={toggleVideo}
    />
  )
}
export type { VideocallTaskSpec }
export default {
  taskComponent: VideocallTask,
  taskSlice: slice,
} as TaskExport
