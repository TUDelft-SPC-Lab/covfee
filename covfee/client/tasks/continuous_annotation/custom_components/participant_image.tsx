import React from "react"

import { Box, Image } from "@chakra-ui/react"
import Participant_10 from "../../../art/participant_imgs/participant_10.png"
import Participant_11 from "../../../art/participant_imgs/participant_11.png"
import Participant_12 from "../../../art/participant_imgs/participant_12.png"
import Participant_13 from "../../../art/participant_imgs/participant_13.png"
import Participant_14 from "../../../art/participant_imgs/participant_14.png"
import Participant_15 from "../../../art/participant_imgs/participant_15.png"
import Participant_17 from "../../../art/participant_imgs/participant_17.png"
import Participant_18 from "../../../art/participant_imgs/participant_18.png"
import Participant_19 from "../../../art/participant_imgs/participant_19.png"
import Participant_2 from "../../../art/participant_imgs/participant_2.png"
import Participant_20 from "../../../art/participant_imgs/participant_20.png"
import Participant_22 from "../../../art/participant_imgs/participant_22.png"
import Participant_23 from "../../../art/participant_imgs/participant_23.png"
import Participant_25 from "../../../art/participant_imgs/participant_25.png"
import Participant_27 from "../../../art/participant_imgs/participant_27.png"
import Participant_28 from "../../../art/participant_imgs/participant_28.png"
import Participant_29 from "../../../art/participant_imgs/participant_29.png"
import Participant_30 from "../../../art/participant_imgs/participant_30.png"
import Participant_32 from "../../../art/participant_imgs/participant_32.png"
import Participant_4 from "../../../art/participant_imgs/participant_4.png"
import Participant_5 from "../../../art/participant_imgs/participant_5.png"
import Participant_6 from "../../../art/participant_imgs/participant_6.png"
import Participant_7 from "../../../art/participant_imgs/participant_7.png"
import Participant_8 from "../../../art/participant_imgs/participant_8.png"
import Participant_9 from "../../../art/participant_imgs/participant_9.png"

interface Props {
  participant_id: number[]
}

const Participant_image: React.FC<Props> = ({ participant_id }: Props) => {
  const participant_images: { [key: string]: string } = {
    "2": Participant_2,
    "4": Participant_4,
    "5": Participant_5,
    "6": Participant_6,
    "7": Participant_7,
    "8": Participant_8,
    "9": Participant_9,
    "10": Participant_10,
    "11": Participant_11,
    "12": Participant_12,
    "13": Participant_13,
    "14": Participant_14,
    "15": Participant_15,
    "17": Participant_17,
    "18": Participant_18,
    "19": Participant_19,
    "20": Participant_20,
    "22": Participant_22,
    "23": Participant_23,
    "25": Participant_25,
    "27": Participant_27,
    "28": Participant_28,
    "29": Participant_29,
    "30": Participant_30,
    "32": Participant_32,
  }
  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      gap="5px" // spacing between images
      flexWrap="wrap" // optional: wrap if too many images
    >
      {participant_id.map((id) => {
        const src = participant_images[id]
        if (!src) return null

        return <Image key={id} src={src} width="50%" height="auto" />
      })}
    </Box>
  )
}

export { Participant_image }
