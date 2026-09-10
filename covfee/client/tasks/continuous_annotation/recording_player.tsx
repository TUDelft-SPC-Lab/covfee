import { Button as ButtonChakra } from "@chakra-ui/react"
import React, { useEffect, useRef, useState } from "react"

type Props = {
  /** Where to fetch the audio from. Null renders a disabled button. */
  src: string | null
  /** Button text when idle. */
  label: string
  /** Text while the take is playing. */
  playingLabel?: string
  size?: string
  variant?: string
}

/**
 * Play/stop control for one recorded take.
 *
 * The <audio> element is created imperatively rather than rendered, so nothing
 * about the take (its length, whether it exists) affects the surrounding layout
 * as the annotator moves between clips.
 */
const RecordingPlayer: React.FC<Props> = ({
  src,
  label,
  playingLabel = "■ Stop",
  size = "sm",
  variant = "outline",
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [playing, setPlaying] = useState(false)

  // A new src means the previous take is gone: stop it rather than letting it
  // play on over the next clip.
  useEffect(() => {
    const audio = audioRef.current
    if (audio) {
      audio.pause()
      audioRef.current = null
    }
    setPlaying(false)
  }, [src])

  useEffect(() => {
    return () => {
      audioRef.current?.pause()
      audioRef.current = null
    }
  }, [])

  const handleToggle = () => {
    if (!src) return

    if (playing) {
      audioRef.current?.pause()
      audioRef.current = null
      setPlaying(false)
      return
    }

    const audio = new Audio(src)
    audio.onended = () => {
      audioRef.current = null
      setPlaying(false)
    }
    audio.onerror = () => {
      audioRef.current = null
      setPlaying(false)
    }
    audioRef.current = audio
    setPlaying(true)
    audio.play().catch(() => {
      audioRef.current = null
      setPlaying(false)
    })
  }

  return (
    <ButtonChakra
      size={size}
      variant={variant}
      colorScheme={playing ? "purple" : "gray"}
      onClick={handleToggle}
      isDisabled={!src}
    >
      {playing ? playingLabel : label}
    </ButtonChakra>
  )
}

export { RecordingPlayer }
