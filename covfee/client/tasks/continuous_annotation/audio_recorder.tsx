import Constants from "Constants"

import { Box, Button as ButtonChakra, HStack, Text } from "@chakra-ui/react"
import { message } from "antd"
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react"

import { nodeContext } from "../../journey/node_context"
import { fetcher } from "../../utils"

/**
 * Metadata for one recording, as returned by the server after the upload.
 */
export type RecordingMeta = {
  id: number
  task_id: number
  annotation_id: number
  clip_index: number
  batch_item_id: number | null
  media_src: string | null
  path: string
  mime: string
  size_bytes: number
  duration_s: number | null
  created_at: string
}

export type AudioRecorderHandle = {
  /**
   * Stops an ongoing recording (if any), uploads it and resolves with the server
   * metadata. Resolves with null when there was nothing being recorded.
   * Rejects when the upload fails, so the caller can abort advancing to the next clip.
   */
  stopAndFlush: () => Promise<RecordingMeta | null>
  /** Back to the idle state, ready for the next clip. Keeps the microphone stream. */
  reset: () => void
}

type Props = {
  annotationId: number
  clipIndex: number
  batchItemId?: number | null
  mediaSrc?: string | null
  disabled?: boolean
  onRecordingSaved?: (meta: RecordingMeta) => void
  /**
   * Fires whenever a take starts or stops. The parent uses it to keep the submit
   * button reachable mid-recording, so pressing "next" can stop and save the take.
   */
  onRecordingStateChange?: (isRecording: boolean) => void
}

type RecorderStatus = "idle" | "recording" | "uploading" | "error"

// Ordered by preference. Chrome/Firefox take the first, Safari falls back to mp4.
const PREFERRED_MIME_TYPES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/mp4",
]

const pickMimeType = (): string | undefined => {
  if (typeof MediaRecorder === "undefined") {
    return undefined
  }
  return PREFERRED_MIME_TYPES.find((type) => MediaRecorder.isTypeSupported(type))
}

const formatElapsed = (seconds: number) => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${String(secs).padStart(2, "0")}`
}

const AudioRecorder = forwardRef<AudioRecorderHandle, Props>((props, ref) => {
  const {
    annotationId,
    clipIndex,
    batchItemId,
    mediaSrc,
    disabled,
    onRecordingSaved,
    onRecordingStateChange,
  } = props

  const { node } = React.useContext(nodeContext)

  const [status, setStatus] = useState<RecorderStatus>("idle")
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [lastRecordedSeconds, setLastRecordedSeconds] = useState<number | null>(
    null,
  )
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  // A take that was captured but could not be uploaded. Kept so the annotator can
  // retry instead of having to speak the answer again.
  const [pendingUpload, setPendingUpload] = useState<{
    blob: Blob
    durationSeconds: number
  } | null>(null)

  // The microphone stream is acquired once and kept for the whole journey, so the
  // browser permission prompt is shown a single time rather than once per clip.
  const streamRef = useRef<MediaStream | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const startedAtRef = useRef<number | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  // Resolved by the MediaRecorder "stop" event, so stopAndFlush can await the
  // last ondataavailable chunk before assembling the blob.
  const stopPromiseRef = useRef<Promise<void> | null>(null)
  const stopResolveRef = useRef<(() => void) | null>(null)

  // The clip a take belongs to is captured when recording starts: by the time the
  // upload runs the parent may already have moved on to the next clip.
  const takeContextRef = useRef<{
    annotationId: number
    clipIndex: number
    batchItemId?: number | null
    mediaSrc?: string | null
    startedAt: number
  } | null>(null)

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  // Release the microphone when the task unmounts.
  useEffect(() => {
    return () => {
      clearTimer()
      if (recorderRef.current && recorderRef.current.state !== "inactive") {
        recorderRef.current.stop()
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
        streamRef.current = null
      }
    }
  }, [clearTimer])

  const getStream = useCallback(async () => {
    if (streamRef.current) {
      return streamRef.current
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error(
        "Audio recording is not available in this browser. Please use a recent version of Chrome.",
      )
    }
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    streamRef.current = stream
    return stream
  }, [])

  const uploadBlob = useCallback(
    async (blob: Blob, durationSeconds: number): Promise<RecordingMeta> => {
      const take = takeContextRef.current
      if (!take) {
        throw new Error("No recording context to upload")
      }

      const formData = new FormData()
      formData.append("file", blob, "recording")
      formData.append("clip_index", String(take.clipIndex))
      if (take.batchItemId !== undefined && take.batchItemId !== null) {
        formData.append("batch_item_id", String(take.batchItemId))
      }
      if (take.mediaSrc) {
        formData.append("media_src", take.mediaSrc)
      }
      formData.append("duration_s", durationSeconds.toFixed(3))
      formData.append("started_at", String(take.startedAt))
      formData.append("stopped_at", String(Date.now()))

      const url =
        Constants.base_url +
        node.customApiBase +
        "/annotations/" +
        take.annotationId +
        "/recording"

      // Note: no Content-Type header, the browser sets the multipart boundary.
      const res = await fetcher(url, { method: "POST", body: formData })
      if (!res.ok) {
        throw new Error(`Upload failed with status ${res.status}`)
      }
      return (await res.json()) as RecordingMeta
    },
    [node.customApiBase],
  )

  /** Uploads one take, keeping it around for a retry if the upload fails. */
  const sendBlob = useCallback(
    async (blob: Blob, durationSeconds: number): Promise<RecordingMeta> => {
      setStatus("uploading")
      try {
        const meta = await uploadBlob(blob, durationSeconds)
        chunksRef.current = []
        setPendingUpload(null)
        setStatus("idle")
        setLastRecordedSeconds(durationSeconds)
        setErrorMessage(null)
        onRecordingSaved?.(meta)
        return meta
      } catch (error: any) {
        const msg =
          "Could not save the recording. Please check your connection and press Retry."
        console.error("Error uploading recording:", error)
        setPendingUpload({ blob, durationSeconds })
        setStatus("error")
        setErrorMessage(msg)
        message.error(msg)
        throw error
      }
    },
    [onRecordingSaved, uploadBlob],
  )

  const startRecording = useCallback(async () => {
    setErrorMessage(null)
    let stream: MediaStream
    try {
      stream = await getStream()
    } catch (error: any) {
      const msg =
        error?.name === "NotAllowedError"
          ? "Microphone access was denied. Please allow it in your browser and try again."
          : error?.message ?? "Could not access the microphone."
      setStatus("error")
      setErrorMessage(msg)
      message.error(msg)
      return
    }

    const mimeType = pickMimeType()
    const recorder = new MediaRecorder(
      stream,
      mimeType ? { mimeType } : undefined,
    )
    // Starting a fresh take supersedes any take that failed to upload.
    chunksRef.current = []
    setPendingUpload(null)
    recorder.ondataavailable = (event: BlobEvent) => {
      if (event.data && event.data.size > 0) {
        chunksRef.current.push(event.data)
      }
    }
    stopPromiseRef.current = new Promise<void>((resolve) => {
      stopResolveRef.current = resolve
    })
    recorder.onstop = () => {
      stopResolveRef.current?.()
      stopResolveRef.current = null
    }

    recorderRef.current = recorder
    const startedAt = Date.now()
    startedAtRef.current = startedAt
    takeContextRef.current = {
      annotationId,
      clipIndex,
      batchItemId,
      mediaSrc,
      startedAt,
    }

    recorder.start()
    setStatus("recording")
    onRecordingStateChange?.(true)
    setElapsedSeconds(0)
    setLastRecordedSeconds(null)
    clearTimer()
    timerRef.current = setInterval(() => {
      setElapsedSeconds((Date.now() - startedAt) / 1000)
    }, 250)
  }, [annotationId, batchItemId, clipIndex, clearTimer, getStream, mediaSrc])

  /**
   * Stops the recorder and uploads what was captured. Shared by the button and by
   * stopAndFlush, so pressing "next" mid-recording keeps the audio.
   */
  const stopAndUpload =
    useCallback(async (): Promise<RecordingMeta | null> => {
      const recorder = recorderRef.current
      if (!recorder || recorder.state === "inactive") {
        return null
      }

      clearTimer()
      const durationSeconds = startedAtRef.current
        ? (Date.now() - startedAtRef.current) / 1000
        : 0
      setElapsedSeconds(durationSeconds)

      recorder.stop()
      await stopPromiseRef.current
      recorderRef.current = null
      onRecordingStateChange?.(false)

      const blob = new Blob(chunksRef.current, {
        type: recorder.mimeType || "audio/webm",
      })
      if (blob.size === 0) {
        const msg = "The recording was empty. Please try again."
        setStatus("error")
        setErrorMessage(msg)
        message.error(msg)
        throw new Error(msg)
      }

      return sendBlob(blob, durationSeconds)
    }, [clearTimer, onRecordingStateChange, sendBlob])

  useImperativeHandle(
    ref,
    () => ({
      stopAndFlush: async () => {
        if (recorderRef.current && recorderRef.current.state !== "inactive") {
          return stopAndUpload()
        }
        // A take captured earlier whose upload failed: send it rather than
        // letting the annotator advance without it.
        if (pendingUpload) {
          return sendBlob(pendingUpload.blob, pendingUpload.durationSeconds)
        }
        return null
      },
      reset: () => {
        clearTimer()
        if (recorderRef.current && recorderRef.current.state !== "inactive") {
          // Nothing to keep: stopAndFlush already ran for a submit-driven advance.
          recorderRef.current.onstop = null
          recorderRef.current.stop()
        }
        recorderRef.current = null
        chunksRef.current = []
        startedAtRef.current = null
        takeContextRef.current = null
        stopPromiseRef.current = null
        stopResolveRef.current = null
        onRecordingStateChange?.(false)
        setPendingUpload(null)
        setStatus("idle")
        setElapsedSeconds(0)
        setLastRecordedSeconds(null)
        setErrorMessage(null)
      },
    }),
    [clearTimer, onRecordingStateChange, pendingUpload, sendBlob, stopAndUpload],
  )

  const handleToggle = () => {
    if (status === "recording") {
      stopAndUpload().catch(() => {
        // Already surfaced to the annotator by stopAndUpload.
      })
    } else if (status !== "uploading") {
      startRecording()
    }
  }

  const statusLine = (() => {
    if (status === "recording") {
      return `Recording… ${formatElapsed(elapsedSeconds)}`
    }
    if (status === "uploading") {
      return "Saving recording…"
    }
    if (status === "error" && errorMessage) {
      return errorMessage
    }
    if (lastRecordedSeconds !== null) {
      return `Recorded ${formatElapsed(lastRecordedSeconds)}`
    }
    return "Press to record your spoken answer for this clip."
  })()

  return (
    <Box mt="20px">
      <HStack spacing={4}>
        <ButtonChakra
          colorScheme={status === "recording" ? "red" : "gray"}
          onClick={handleToggle}
          isDisabled={disabled}
          isLoading={status === "uploading"}
          loadingText="Saving"
        >
          {status === "recording" ? "■ Stop recording" : "● Start recording"}
        </ButtonChakra>
        {pendingUpload && status !== "uploading" && (
          <ButtonChakra
            colorScheme="orange"
            variant="outline"
            onClick={() => {
              sendBlob(pendingUpload.blob, pendingUpload.durationSeconds).catch(
                () => {
                  // Already surfaced to the annotator by sendBlob.
                },
              )
            }}
          >
            Retry saving
          </ButtonChakra>
        )}
        <Text
          fontSize="sm"
          color={status === "error" ? "red.600" : "gray.600"}
          aria-live="polite"
        >
          {statusLine}
        </Text>
      </HStack>
    </Box>
  )
})

AudioRecorder.displayName = "AudioRecorder"

export { AudioRecorder }
