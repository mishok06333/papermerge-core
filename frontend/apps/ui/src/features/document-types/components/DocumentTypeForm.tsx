import {OWNER_ME} from "@/cconstants"
import CopyButton from "@/components/CopyButton"
import {Box, TextInput, Textarea} from "@mantine/core"
import {useTranslation} from "react-i18next"
import type {DocType} from "../types"

type Args = {
  documentType: DocType | null
}

export default function DocumentTypeForm({documentType}: Args) {
  const {t} = useTranslation()
  return (
    <Box>
      <TextInput
        my="md"
        label={t("common.field_id")}
        value={documentType?.id || ""}
        onChange={() => {}}
        rightSection={<CopyButton value={documentType?.id || ""} />}
      />
      <TextInput
        my="md"
        label={t("document_types.form.name")}
        value={documentType?.name || ""}
        onChange={() => {}}
        rightSection={<CopyButton value={documentType?.name || ""} />}
      />
      <Textarea
        my="md"
        label={t("document_types.form.path_template")}
        autosize
        minRows={6}
        resize="vertical"
        onChange={() => {}}
        rightSection={<CopyButton value={documentType?.path_template || ""} />}
        value={documentType?.path_template}
      />
      <TextInput
        my="md"
        label={t("common.owner")}
        value={documentType?.group_name || OWNER_ME}
        onChange={() => {}}
        rightSection={
          <CopyButton value={documentType?.group_name || OWNER_ME} />
        }
      />
    </Box>
  )
}
