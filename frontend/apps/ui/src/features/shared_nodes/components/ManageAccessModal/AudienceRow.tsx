import type {AudienceRole} from "@/types.d/shared_nodes"
import {Checkbox, Table} from "@mantine/core"

interface Args {
  audience: AudienceRole
  selectedIDs: string[]
  onChange: (audience_id: string, checked: boolean) => void
}

export default function AudienceRow({audience, selectedIDs, onChange}: Args) {
  const onLocalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.currentTarget.checked) {
      onChange(audience.id, true)
    } else {
      onChange(audience.id, false)
    }
  }

  return (
    <Table.Tr>
      <Table.Td>
        <Checkbox
          checked={selectedIDs.includes(audience.id)}
          onChange={onLocalChange}
        />
      </Table.Td>
      <Table.Td>{audience.name}</Table.Td>
      <Table.Td>{audience.roles.map(r => r.name).join(",")}</Table.Td>
    </Table.Tr>
  )
}
