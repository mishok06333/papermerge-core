import {useAppSelector} from "@/app/hooks"
import {ActionIcon, Group, Skeleton, Stack, TagsInput} from "@mantine/core"
import {useDisclosure} from "@mantine/hooks"
import {useContext} from "react"
import {useTranslation} from "react-i18next"

import PanelContext from "@/contexts/PanelContext"
import {useGetDocumentQuery} from "@/features/document/store/apiSlice"
import {skipToken} from "@reduxjs/toolkit/query"
import {IconEdit} from "@tabler/icons-react"
import classes from "./DocumentDetails.module.css"

import {EditNodeTagsModal} from "@/components/EditNodeTags"
import type {DocumentType} from "@/features/document/types"
import {
  selectCurrentNodeID,
  selectDocumentDetailsPanelOpen
} from "@/features/ui/uiSlice"
import type {PanelMode} from "@/types"
import DocumentDetailsToggle from "../DocumentDetailsToggle"
import DocumentLibraryPanel from "@/features/library/components/DocumentLibraryPanel"

interface Args {
  doc?: DocumentType
  docID?: string
  isLoading: boolean
}

export default function DocumentDetails({doc, docID, isLoading}: Args) {
  const {t} = useTranslation()

  const mode: PanelMode = useContext(PanelContext)
  const documentDetailsIsOpen = useAppSelector(s =>
    selectDocumentDetailsPanelOpen(s, mode)
  )

  if (!docID || isLoading) {
    return (
      <Group align="flex-start" className={classes.documentDetailsOpened}>
        <DocumentDetailsToggle />
        <Stack className={classes.documentDetailsContent} justify="flex-start">
          <Skeleton height={"20"} />
          <Skeleton height={"20"} />
          <Skeleton height={"20"} />
        </Stack>
      </Group>
    )
  }

  if (documentDetailsIsOpen) {
    return (
      <Group align="flex-start" className={classes.documentDetailsOpened}>
        <Stack className={classes.documentDetailsContent} justify="flex-start">
          <Group>
            <TagsInput
              rightSection={<EditTagsButton />}
              label={t("common.tags")}
              readOnly
              value={doc?.tags?.map(t => t.name) || []}
              mt="md"
            />
          </Group>
          {docID ? <DocumentLibraryPanel documentId={docID} /> : null}
        </Stack>
      </Group>
    )
  }

  return <></>
}

function EditTagsButton() {
  const [opened, {open, close}] = useDisclosure(false)
  const mode: PanelMode = useContext(PanelContext)
  const docID = useAppSelector(s => selectCurrentNodeID(s, mode))
  const {currentData: doc} = useGetDocumentQuery(docID ?? skipToken)

  const onClick = () => {
    open()
  }

  const onSubmit = () => {
    close()
  }

  const onCancel = () => {
    close()
  }

  return (
    <>
      <ActionIcon variant="default" onClick={onClick}>
        <IconEdit stroke={1.4} />
      </ActionIcon>
      {doc && (
        <EditNodeTagsModal
          opened={opened}
          node={doc}
          onSubmit={onSubmit}
          onCancel={onCancel}
        />
      )}
    </>
  )
}
