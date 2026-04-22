import {useGetUsersQuery} from "@/features/users/apiSlice"
import {MultiSelect, Skeleton, Stack} from "@mantine/core"
import {useState} from "react"
import {displayName} from "@/utils/userDisplay"
import {useTranslation} from "react-i18next"

interface Args {
  onChange: (value: string[]) => void
}

export default function SelectUsers({onChange}: Args) {
  const {t} = useTranslation()
  const [users, setUsers] = useState<string[]>([])
  const {data, isLoading} = useGetUsersQuery()

  const onChangeLocal = (value: string[]) => {
    setUsers(value)
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
        label={t("users.name")}
        placeholder={t("common.pick_value")}
        value={users}
        onChange={onChangeLocal}
        data={data.map(u => ({value: u.id, label: displayName(u)}))}
      />
    </Stack>
  )
}
