import {
  Button,
  Container,
  Group,
  Loader,
  Modal,
  Stack,
  Text,
  TextInput
} from "@mantine/core"
import {useEffect, useState} from "react"
import type {CSSProperties} from "react"

import {useAppDispatch} from "@/app/hooks"
import {apiSlice} from "@/features/api/slice"
import {uploadFile} from "@/features/files/filesSlice"

import Error from "@/components/Error"
import ScheduleOCRProcessCheckbox from "@/components/ScheduleOCRProcessCheckbox/ScheduleOCRProcessCheckbox"
import {generateThumbnail} from "@/features/nodes/thumbnailObjectsSlice"
import type {UploadFileOutput} from "@/features/nodes/types"
import {useRuntimeConfig} from "@/hooks/runtime_config"
import {
  buildFileNameWithOriginalExtension,
  isAcceptableUploadStem,
  isOcrCandidateFile,
  splitStemAndExtension
} from "@/features/document/documentPreview"
import type {FolderType, OCRCode} from "@/types"
import {useTranslation} from "react-i18next"

type Args = {
  opened: boolean
  source_files: FileList | File[]
  target: FolderType
  onSubmit: () => void
  onCancel: () => void
}

function fileWithRenamedStem(file: File, editedStem: string): File {
  const name = buildFileNameWithOriginalExtension(file.name, editedStem)
  if (!name || name === file.name) {
    return file
  }
  return new File([file], name, {
    type: file.type,
    lastModified: file.lastModified
  })
}

const extSuffixStyle: CSSProperties = {
  flexShrink: 0,
  fontFamily: "var(--mantine-font-family-monospace)"
}

export const DropFilesModal = ({
  source_files,
  target,
  onSubmit,
  onCancel,
  opened
}: Args) => {
  const {t} = useTranslation()
  const runtimeConfig = useRuntimeConfig()
  const dispatch = useAppDispatch()
  const [error, setError] = useState("")
  const [scheduleOCR, setScheduleOCR] = useState<boolean>(false)
  const [lang, setLang] = useState<OCRCode>("deu")
  const [fileStems, setFileStems] = useState<string[]>([])
  const filesArray = [...source_files]
  const target_title = target.title
  const showOcrOption = filesArray.some((f, i) =>
    isOcrCandidateFile(
      buildFileNameWithOriginalExtension(
        f.name,
        fileStems[i] ?? splitStemAndExtension(f.name).stem
      )
    )
  )

  useEffect(() => {
    if (opened) {
      setFileStems(
        Array.from(source_files).map(f => splitStemAndExtension(f.name).stem)
      )
    }
  }, [opened, source_files])

  const namesValid =
    filesArray.length > 0 &&
    filesArray.every((f, i) =>
      isAcceptableUploadStem(
        f.name,
        fileStems[i] ?? splitStemAndExtension(f.name).stem
      )
    )

  const onLangChange = (newLang: OCRCode) => {
    setLang(newLang)
  }

  const onCheckboxChange = (newValue: boolean) => {
    setScheduleOCR(newValue)
  }

  const localSubmit = async () => {
    if (!namesValid) {
      return
    }
    for (let i = 0; i < source_files.length; i++) {
      const file = fileWithRenamedStem(
        source_files[i],
        fileStems[i] ?? splitStemAndExtension(source_files[i].name).stem
      )
      const result = await dispatch(
        uploadFile({
          file,
          refreshTarget: true,
          ocr: scheduleOCR,
          lang: lang,
          target
        })
      )
      const newlyCreatedNode = result.payload as UploadFileOutput

      if (newlyCreatedNode.source?.id) {
        const newNodeID = newlyCreatedNode.source?.id
        dispatch(generateThumbnail({node_id: newNodeID, file}))
      }
      dispatch(apiSlice.util.invalidateTags(["Node"]))
    }

    onSubmit()
  }

  const localCancel = () => {
    // just close the dialog
    setError("")
    onCancel()
  }

  return (
    <Modal
      title={t("nodes.upload.title")}
      opened={opened}
      onClose={localCancel}
    >
      <Container>
        <Text component="div" mb="sm">
          {t("nodes.upload.confirm_lead")}{" "}
          <Text span c="green">
            {target_title}
          </Text>
          ?
        </Text>
        <Stack gap="sm" mb="md">
          {filesArray.map((f, i) => {
            const {stem, ext} = splitStemAndExtension(f.name)
            return (
              <div key={`${f.name}-${i}-${f.size}`}>
                <Text size="sm" fw={500} mb={4}>
                  {filesArray.length > 1
                    ? `${t("nodes.upload.file_name")} (${i + 1})`
                    : t("nodes.upload.file_name")}
                </Text>
                <Group gap={6} align="center" wrap="nowrap">
                  <TextInput
                    style={{flex: 1, minWidth: 0}}
                    aria-label={t("nodes.upload.file_name")}
                    value={fileStems[i] ?? stem}
                    onChange={e => {
                      const next = [...fileStems]
                      next[i] = e.currentTarget.value
                      setFileStems(next)
                    }}
                  />
                  {ext ? (
                    <Text size="sm" c="dimmed" style={extSuffixStyle}>
                      {ext}
                    </Text>
                  ) : null}
                </Group>
              </div>
            )
          })}
        </Stack>
        {!runtimeConfig.ocr__automatic && showOcrOption && (
          <ScheduleOCRProcessCheckbox
            initialCheckboxValue={false}
            defaultLang={runtimeConfig.ocr__default_lang_code}
            onCheckboxChange={onCheckboxChange}
            onLangChange={onLangChange}
          />
        )}
        {error && <Error message={error} />}
        <Group gap="lg" justify="space-between">
          <Button variant="default" onClick={localCancel}>
            {t("common.cancel")}
          </Button>
          <Button
            leftSection={false && <Loader size={"sm"} />}
            onClick={localSubmit}
            disabled={!namesValid}
          >
            {t("common.upload")}
          </Button>
        </Group>
      </Container>
    </Modal>
  )
}
