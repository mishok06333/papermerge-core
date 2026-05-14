import {CUSTOM_FIELD_DATA_TYPES} from "@/cconstants"
import CopyButton from "@/components/CopyButton"
import type {CustomField} from "@/types"
import {Box, NativeSelect, TextInput} from "@mantine/core"
import {useTranslation} from "react-i18next"

type Args = {
  customField: CustomField | null
}

export default function CustomFieldForm({customField}: Args) {
  const {t} = useTranslation()
  return (
    <Box>
      <TextInput
        my="md"
        label={t("common.field_id")}
        value={customField?.id || ""}
        onChange={() => {}}
        rightSection={<CopyButton value={customField?.id || ""} />}
      />
      <TextInput
        my="md"
        label={t("custom_fields.form.name")}
        value={customField?.name || ""}
        onChange={() => {}}
        rightSection={<CopyButton value={customField?.name || ""} />}
      />
      <NativeSelect
        mt="sm"
        label={t("custom_fields.form.type")}
        value={customField?.type || ""}
        data={CUSTOM_FIELD_DATA_TYPES}
        onChange={() => {}}
      />
      <TextInput
        my="md"
        label={t("common.owner")}
        value={customField?.group_name || t("me")}
        onChange={() => {}}
        rightSection={
          <CopyButton value={customField?.group_name || t("me")} />
        }
      />
    </Box>
  )
}
