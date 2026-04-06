import type {AudienceRole} from "@/types.d/shared_nodes"
import {SharedNodeAccessDetails} from "@/types.d/shared_nodes"
import {Center, Checkbox, Skeleton, Stack, Table} from "@mantine/core"
import AudienceAccessButtons from "./AudienceAccessButtons"
import AudienceRow from "./AudienceRow"
import type {IDType} from "./type"

interface Args {
  data?: SharedNodeAccessDetails
  selectedIDs: string[]
  onSelectionChange: (audience_id: string, checked: boolean) => void
  onClickViewButton: (sel_id: string, idType: IDType) => void
  onClickDeleteButton: (sel_ids: string[], idType: IDType) => void
}

export default function ManageAccessAudienceRoles({
  data,
  selectedIDs,
  onSelectionChange,
  onClickDeleteButton,
  onClickViewButton
}: Args) {
  if (!data) {
    return <Skeleton my={"lg"} height={30}></Skeleton>
  }

  const list = data.audience_roles || []

  if (list.length == 0) {
    return <Empty />
  }

  const onLocalSelectAll = () => {}

  const rows = Array.from(list)
    .sort(sortPredicate)
    .map(a => (
      <AudienceRow
        selectedIDs={selectedIDs}
        onChange={onSelectionChange}
        key={a.id}
        audience={a}
      />
    ))

  return (
    <Stack my={"sm"}>
      <AudienceAccessButtons
        selectedIDs={selectedIDs}
        onClickDeleteButton={onClickDeleteButton}
        onClickViewButton={onClickViewButton}
      />
      <Table withTableBorder withColumnBorders my={"sm"}>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>
              <Checkbox onClick={onLocalSelectAll} />
            </Table.Th>
            <Table.Th>Account role (all members)</Table.Th>
            <Table.Th>Access on item</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>{rows}</Table.Tbody>
      </Table>
    </Stack>
  )
}

function sortPredicate(a1: AudienceRole, a2: AudienceRole) {
  const name1 = a1.name.toLowerCase()
  const name2 = a2.name.toLowerCase()

  if (name1 < name2) {
    return -1
  }
  if (name1 > name2) {
    return 1
  }

  return 0
}

function Empty() {
  return <Center my={"md"}>No role-based audiences</Center>
}
