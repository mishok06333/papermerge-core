import {useGetRolesQuery} from "@/features/roles/apiSlice"
import {MultiSelect, Skeleton, Stack} from "@mantine/core"
import {useState} from "react"
import {useTranslation} from "react-i18next"

interface Args {
  onChange: (value: string[]) => void
}

export default function SelectRoles({onChange}: Args) {
  const {t} = useTranslation()
  const [roles, setRoles] = useState<string[]>([])
  const {data, isLoading} = useGetRolesQuery()

  const onChangeLocal = (value: string[]) => {
    setRoles(value)
    onChange(value)
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
        label={t("share.access_roles.label")}
        description={t("share.access_roles.description")}
        placeholder={t("common.pick_value")}
        value={roles}
        onChange={onChangeLocal}
        data={data.map(g => g.name)}
      />
    </Stack>
  )
}
