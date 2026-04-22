import {useGetRolesQuery} from "@/features/roles/apiSlice"
import {MultiSelect, Skeleton, Stack} from "@mantine/core"
import {useState} from "react"
import {useTranslation} from "react-i18next"

interface Args {
  onChange: (value: string[]) => void
}

/** Account roles: every user assigned one of these roles receives the share. */
export default function SelectRecipientRoles({onChange}: Args) {
  const {t} = useTranslation()
  const [value, setValue] = useState<string[]>([])
  const {data, isLoading} = useGetRolesQuery()

  const onChangeLocal = (next: string[]) => {
    setValue(next)
    onChange(next)
  }

  if (isLoading || !data) {
    return (
      <Stack>
        <Skeleton />
      </Stack>
    )
  }

  return (
    <Stack my={"md"}>
      <MultiSelect
        searchable
        label={t("share.recipient_roles.label")}
        description={t("share.recipient_roles.description")}
        placeholder={t("common.pick_value")}
        value={value}
        onChange={onChangeLocal}
        data={data.map(r => r.name)}
      />
    </Stack>
  )
}
