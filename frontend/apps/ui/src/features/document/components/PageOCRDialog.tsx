import {useAppSelector} from "@/app/hooks"
import {useCurrentDocVer} from "@/features/document/hooks"
import {selectAllPages} from "@/features/document/store/documentVersSlice"
import {TextStandalonePreview} from "@/features/document/components/Page/TextStandalonePreview"
import {Box, Button, Group, Modal, Text} from "@mantine/core"
import {useEffect, useMemo, useRef} from "react"
interface Args {
  opened: boolean
  onClose: () => void
}

export const PageOCRDialog = ({onClose, opened}: Args) => {
  /* Show OCRed text of one or multiple pages */
  const ref = useRef<HTMLButtonElement>(null)
  const {docVer} = useCurrentDocVer()
  const pages = useAppSelector(s => selectAllPages(s, docVer?.id)) || []

  useEffect(() => {
    if (!opened) {
      return
    }
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.code === "Enter" && ref.current) {
        ref.current.click()
      }
    }
    document.addEventListener("keydown", handleKeydown, false)
    return () => {
      document.removeEventListener("keydown", handleKeydown, false)
    }
  }, [opened])

  // All pages, ordered — not viewer selection (selection hid OCR when any pages were selected; subtask 3).
  const combinedOcrText = useMemo(() => {
    const ordered = [...pages].sort((a, b) => a.number - b.number)
    const result = ordered
      .map(p => p.text ?? "")
      .join(" ")
      .trim()
    return result.length > 0 ? result : null
  }, [pages])

  const onLocalClose = () => {
    onClose()
  }

  return (
    <Modal
      title={"OCR Text"}
      size="xl"
      opened={opened}
      onClose={onLocalClose}
      styles={{
        body: {
          display: "flex",
          flexDirection: "column",
          gap: "var(--mantine-spacing-md)",
          minHeight: 0
        }
      }}
    >
      {combinedOcrText ? (
        <Box
          style={{
            flex: 1,
            minHeight: 0,
            display: "flex",
            flexDirection: "column"
          }}
        >
          <TextStandalonePreview mode="modal">
            {combinedOcrText}
          </TextStandalonePreview>
        </Box>
      ) : (
        <Text c="dimmed">
          No OCR text available. Run OCR on this document first.
        </Text>
      )}
      <Group justify="space-between" mt={combinedOcrText ? 0 : "md"}>
        <Button ref={ref} variant="default" onClick={onLocalClose}>
          Close
        </Button>
      </Group>
    </Modal>
  )
}

export default PageOCRDialog
