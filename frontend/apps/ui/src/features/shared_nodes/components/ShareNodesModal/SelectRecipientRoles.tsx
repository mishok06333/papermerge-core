import {useGetRolesQuery} from "@/features/roles/apiSlice"
import {MultiSelect, Skeleton, Stack} from "@mantine/core"
import {useState} from "react"

interface Args {
  onChange: (value: string[]) => void
}

/** Account roles: every user assigned one of these roles receives the share. */
export default function SelectRecipientRoles({onChange}: Args) {
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
        label="All users with role (account role)"
        description="Share with everyone who has this role assigned to their account"
        placeholder="Pick value"
        value={value}
        onChange={onChangeLocal}
        data={data.map(r => r.name)}
      />
    </Stack>
  )
}
