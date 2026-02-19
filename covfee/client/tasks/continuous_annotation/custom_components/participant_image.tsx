import React from "react"

import { Box, Image } from "@chakra-ui/react"
import Participant_13 from "../../../../../samples/continuous_annotation/art/participant_imgs/participant_13.png"

interface Props {
    participant_id: string[]
}

const Participant_image: React.FC<Props> = ({ participant_id }:Props) => {
    const participant_images: { [key: string]: string } = {
        "13": Participant_13,
    }
    return(
        <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            gap="5px" // spacing between images
            flexWrap="wrap" // optional: wrap if too many images
            >
            {participant_id.map(id => {
                const src = participant_images[id];
                if (!src) return null;

                return (
                <Image
                    key={id}
                    src={src}
                    width="50%"
                    height="auto"
                />
                );
            })}
            </Box>

    )
}

export { Participant_image }
