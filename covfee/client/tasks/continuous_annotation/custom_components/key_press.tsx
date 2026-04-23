import { useEffect, useState } from "react"

type Timestamp = {
  start: number
  end: number
  category: "Gesture" | "Drinking" | "Toasting" | "Nodding" | "Uncertain"
}

type PressData = {
  data: Timestamp[]
}

interface Props {
  pressData: PressData
  setPressData: (data: PressData) => void
  getCurrentPausedTime: () => number
}

export default function KeyPress({
  pressData,
  setPressData,
  getCurrentPausedTime,
}: Props): null {
  const [currTimestamp, setCurrTimestamp] = useState<Timestamp>({
    start: 0,
    end: 0,
    category: "Uncertain",
  })

  const keyDict = {
    Digit1: "Gesture",
    Digit2: "Drinking",
    Digit3: "Toasting",
    Digit4: "Nodding",
    Digit5: "Uncertain",
  }

  type DigitKey = keyof typeof keyDict

  function getValue(key: DigitKey) {
    return keyDict[key]
  }

  useEffect(() => {
    if (currTimestamp.start !== 0 && currTimestamp.end !== 0) {
      setPressData({
        data: [...pressData.data, currTimestamp],
      })
    }
    console.log("Current Data!!!:", pressData.data)
  }, [currTimestamp])

  const onPressKey = (key: string) => {
    console.log("Key pressed")
    setCurrTimestamp({
      start: getCurrentPausedTime(),
      end: 0,
      category: keyDict[key] || "Uncertain",
    })
  }

  const onReleaseKey = (key: string) => {
    console.log("Key released", getCurrentPausedTime())
    setCurrTimestamp((prev) => ({
      ...prev,
      end: getCurrentPausedTime(),
    }))
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!e.repeat) {
        e.preventDefault()
        onPressKey(e.code)
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      e.preventDefault()
      onReleaseKey(e.code)
    }

    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keyup", handleKeyUp)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
    }
  }, [])

  return null
}
