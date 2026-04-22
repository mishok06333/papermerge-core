import {useGetGroupsQuery} from "@/features/groups/apiSlice"
import {MultiSelect, Skeleton, Stack} from "@mantine/core"
import {useState} from "react"
import {useTranslation} from "react-i18next"

interface Args {
  onChange: (value: string[]) => void
}

export default function SelectGroups({onChange}: Args) {
  const {t} = useTranslation()
  const [groups, setGroups] = useState<string[]>([])
  const {data, isLoading} = useGetGroupsQuery()

  const onChangeLocal = (value: string[]) => {
    setGroups(value)
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
        label={t("groups.name")}
        placeholder={t("common.pick_value")}
        value={groups}
        onChange={onChangeLocal}
        data={data.map(g => g.name)}
      />
    </Stack>
  )
}
