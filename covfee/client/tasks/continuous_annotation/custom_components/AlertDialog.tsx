import {
    AlertDialog,
    AlertDialogBody,
    AlertDialogContent,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogOverlay,
    Button as ButtonChakra
} from "@chakra-ui/react"
import React from "react"

interface Props {
  isOpen: boolean
  onClose: () => void
  deleteTab: () => void
}

const DeleteAlertDialogue: React.FC<Props> = ({
  isOpen,
  onClose,
  deleteTab
}) => {
  const cancelRef = React.useRef<HTMLButtonElement>(null)

  return (
    <AlertDialog
    isOpen={isOpen}
    leastDestructiveRef={cancelRef}
    onClose={onClose}
    >
    <AlertDialogOverlay>
        <AlertDialogContent>
        <AlertDialogHeader fontSize="lg" fontWeight="bold">
            Delete Narrative
        </AlertDialogHeader>

        <AlertDialogBody>
            Are you sure you want to delete this narrative?
            This action cannot be undone.
        </AlertDialogBody>

        <AlertDialogFooter>
            <ButtonChakra ref={cancelRef} onClick={onClose}>
            Cancel
            </ButtonChakra>
            <ButtonChakra colorScheme="red" onClick={deleteTab} ml={3}>
            Delete
            </ButtonChakra>
        </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialogOverlay>
    </AlertDialog>
  )
}

export { DeleteAlertDialogue }
