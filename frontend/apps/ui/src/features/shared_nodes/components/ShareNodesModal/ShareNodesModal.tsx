import {useGetGroupsQuery} from "@/features/groups/apiSlice"
import {useGetRolesQuery} from "@/features/roles/apiSlice"
import {useAddNewSharedNodeMutation} from "@/features/shared_nodes/store/apiSlice"
import {useGetUsersQuery} from "@/features/users/apiSlice"
import {Button, Container, Group, Loader, Modal} from "@mantine/core"
import {notifications} from "@mantine/notifications"
import {useState} from "react"
import SelectGroups from "./SelectGroups"
import SelectRecipientRoles from "./SelectRecipientRoles"
import SelectRoles from "./SelectRoles"
import SelectUsers from "./SelectUsers"

type Args = {
  opened: boolean
  node_ids: Array<string>
  onSubmit: () => void
  onCancel: () => void
}

export const ShareNodesModal = ({
  node_ids,
  onSubmit,
  onCancel,
  opened
}: Args) => {
  const [users, setUsers] = useState<string[]>([])
  const [roles, setRoles] = useState<string[]>([])
  const [groups, setGroups] = useState<string[]>([])
  const [recipientRoles, setRecipientRoles] = useState<string[]>([])
  const {data: dataUsers} = useGetUsersQuery()
  const {data: dataRoles} = useGetRolesQuery()
  const {data: dataGroups} = useGetGroupsQuery()
  const [addNewSharedNode, {isLoading, isSuccess}] =
    useAddNewSharedNodeMutation()

  const onUsersChange = (newValue: string[]) => {
    setUsers(newValue)
  }
  const onRolesChange = (newValue: string[]) => {
    setRoles(newValue)
  }
  const onGroupsChange = (newValue: string[]) => {
    setGroups(newValue)
  }
  const onRecipientRolesChange = (newValue: string[]) => {
    setRecipientRoles(newValue)
  }

  const localSubmit = async () => {
    const group_ids =
      dataGroups?.filter(g => groups?.includes(g.name)).map(g => g.id) || []
    const user_ids =
      dataUsers?.filter(u => users?.includes(u.username)).map(u => u.id) || []
    const role_ids =
      dataRoles?.filter(r => roles?.includes(r.name)).map(r => r.id) || []
    const recipient_role_ids =
      dataRoles
        ?.filter(r => recipientRoles?.includes(r.name))
        .map(r => r.id) || []

    const newSharedNodeData = {
      user_ids,
      group_ids,
      recipient_role_ids,
      role_ids,
      node_ids
    }
    if (role_ids.length === 0) {
      notifications.show({
        title: "Share",
        message: "Pick at least one access role (defines what recipients can do with the item).",
        color: "yellow"
      })
      return
    }
    if (
      user_ids.length === 0 &&
      group_ids.length === 0 &&
      recipient_role_ids.length === 0
    ) {
      notifications.show({
        title: "Share",
        message:
          "Pick at least one user, group, or account role (all members).",
        color: "yellow"
      })
      return
    }
    try {
      await addNewSharedNode(newSharedNodeData).unwrap()
      onSubmit()
      reset()
    } catch (err: unknown) {
      const message =
        err &&
        typeof err === "object" &&
        "data" in err &&
        err.data &&
        typeof err.data === "object" &&
        "detail" in err.data
          ? String((err.data as {detail: unknown}).detail)
          : "Share failed"
      notifications.show({title: "Share", message, color: "red"})
    }
  }

  const localCancel = () => {
    // just close the dialog
    onCancel()
  }

  const reset = () => {
    setGroups([])
    setUsers([])
    setRoles([])
    setRecipientRoles([])
  }

  return (
    <Modal
      title="Share Documents and Folders"
      opened={opened}
      onClose={localCancel}
    >
      <Container>
        Pick users, groups, and/or everyone with an account role. Then choose
        access roles for the shared item.
        <SelectUsers onChange={onUsersChange} />
        <SelectGroups onChange={onGroupsChange} />
        <SelectRecipientRoles onChange={onRecipientRolesChange} />
        <SelectRoles onChange={onRolesChange} />
        <Group gap="lg" justify="space-between">
          <Button variant="default" onClick={localSubmit}>
            Cancel
          </Button>
          <Button
            leftSection={false && <Loader size={"sm"} />}
            onClick={localSubmit}
            disabled={isLoading || isSuccess}
          >
            Share
          </Button>
        </Group>
      </Container>
    </Modal>
  )
}
