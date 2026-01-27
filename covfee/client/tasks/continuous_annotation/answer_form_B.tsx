import { Button as ButtonChakra, Text, Textarea } from "@chakra-ui/react";
import React from "react";

type Props = {
    videoLengthMismatch?: boolean,
    freeTextAnswer1?: string,
    freeTextAnswer2?: string,
    setFreeTextAnswer1: (value: string) => void,
    setFreeTextAnswer2: (value: string) => void,
    postFreetextAnswerToServer: () => void,
    submitFreeTextToServer: () => void,
}

const Answer_form_B: React.FC<Props> = ({videoLengthMismatch, freeTextAnswer1, freeTextAnswer2, setFreeTextAnswer1, setFreeTextAnswer2, postFreetextAnswerToServer, submitFreeTextToServer}: Props) => {

    const [submittable, setSubmittable] = React.useState(false);
      React.useEffect(() => {
        if (freeTextAnswer1 && freeTextAnswer1.length > 0 && freeTextAnswer2 && freeTextAnswer2.length > 0) {
            setSubmittable(true);
        } else {
            setSubmittable(false);
        }
      }, [freeTextAnswer1, freeTextAnswer2])

    return(
        <div>
            <Text marginTop="10px" marginLeft="10px">Form B: What intention do you see in the video:</Text>
            <Textarea onChange={(e) => setFreeTextAnswer1(e.target.value)} onBlur={() => postFreetextAnswerToServer()}/>
            <Text marginTop="20px" marginLeft="10px">Explain why you believe it to be their intention:</Text>
            <Textarea onChange={(e) => setFreeTextAnswer2(e.target.value)} onBlur={() => postFreetextAnswerToServer()}/>
            <ButtonChakra onClick={submitFreeTextToServer} marginTop="10px" colorScheme="blue" isDisabled={videoLengthMismatch || !submittable}>Submit Annotation</ButtonChakra>
        
        </div>
    )
}

export { Answer_form_B };

