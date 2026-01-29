import React from "react"
import videojs, { VideoJsPlayerOptions } from "video.js"
import "video.js/dist/video-js.css"

interface Props {
  options: VideoJsPlayerOptions
  audioSrc?: string | string[]
  audioToggles?: boolean[]
  onReady?: (player: videojs.Player) => void
  onPausedAt?: (time: number) => void
}

export const VideoJSFC: React.FC<Props> = ({
  options,
  audioSrc,
  audioToggles = [],
  onReady,
  onPausedAt,
}) => {
  const videoRef = React.useRef<HTMLDivElement | null>(null)
  const playerRef = React.useRef<videojs.Player | null>(null)
  const audioRefs = React.useRef<HTMLAudioElement[]>([])

  // Initialize Video.js
  React.useEffect(() => {
    if (!playerRef.current && videoRef.current) {
      const videoElement = document.createElement("video-js")
      videoElement.classList.add("vjs-big-play-centered")
      videoRef.current.appendChild(videoElement)

      const player = (playerRef.current = videojs(videoElement, options, () => {
        onReady?.(player)
      }))

      // Mute video audio
      player.muted(true)

      // Play/pause/seeking sync for all audio tracks
      player.on("play", () => audioRefs.current.forEach(a => a.play()))
      player.on("pause", () => {
        const currentTime = player.currentTime()
        audioRefs.current.forEach(a => a.pause())
        onPausedAt?.(currentTime)
      })
      player.on("seeking", () => {
        const time = player.currentTime()
        audioRefs.current.forEach(a => {
          a.currentTime = time
        })
      })

      // Smooth 3-second interval sync
      const interval = setInterval(() => {
        const time = player.currentTime()
        audioRefs.current.forEach(a => {
          const drift = time - a.currentTime
          if (Math.abs(drift) > 0.2) a.currentTime = time
        })
      }, 3000)

      return () => clearInterval(interval)
    }
  }, [options, audioSrc, onReady])

  // Dispose Video.js on unmount
  React.useEffect(() => {
    const player = playerRef.current
    return () => {
      if (player && !player.isDisposed()) {
        player.dispose()
        playerRef.current = null
      }
    }
  }, [])

  // Render audio elements
  const audioElements = React.useMemo(() => {
    if (!audioSrc) return null

    const sources = Array.isArray(audioSrc) ? audioSrc : [audioSrc]

    return sources.map((src, index) => (
      <audio
        key={index}
        ref={el => {
          if (el) audioRefs.current[index] = el
        }}
        src={src}
        preload="auto"
        muted={audioToggles[index] === false} // false = muted
      />
    ))
  }, [audioSrc, audioToggles])

  return (
    <div data-vjs-player>
      <div ref={videoRef} />
      {audioElements}
    </div>
  )
}

export default VideoJSFC
