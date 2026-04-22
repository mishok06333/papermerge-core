import {useGetRolesQuery} from "@/features/roles/apiSlice"
import {
  useGetSharedNodeAccessDetailsQuery,
  useUpdateSharedNodeAccessMutation
} from "@/features/shared_nodes/store/apiSlice"
import type {
  AudienceRoleUpdate,
  GroupUpdate,
  SharedNodeAccessDetails,
  SharedNodeAccessUpdate,
  UserUpdate
} from "@/types.d/shared_nodes"
import {Button, Container, Group, Loader, Modal, Tabs} from "@mantine/core"
import {IconShield, IconUsers, IconUsersGroup} from "@tabler/icons-react"
import {produce} from "immer"
import {useEffect, useState} from "react"
import {useTranslation} from "react-i18next"
import ManageAccessAudienceRoles from "./ManageAccessAudienceRoles"
import ManageAccessGroups from "./ManageAccessGroups"
import ManageAccessUsers from "./ManageAccessUsers"
import ManageRole from "./ManageRole"
import type {IDType} from "./type"

interface ModalStackReturnType<T extends string> {
  state: Record<T, boolean>
  open: (id: T) => void
  close: (id: T) => void
  toggle: (id: T) => void
  closeAll: () => void
  register: (id: T) => {
    opened: boolean
    onClose: () => void
    stackId: T
  }
}

type ManagedRole = {
  idType: IDType
  selectedID: string
  roles: string[]
}

type Args = {
  stack: ModalStackReturnType<"manage-access" | "manage-role">
  node_id: string
  onClose: () => void
}

export const ManageAccessModal = ({node_id, onClose, stack}: Args) => {
  const {t} = useTranslation()
  const {data: initialData, isLoading} =
    useGetSharedNodeAccessDetailsQuery(node_id)
  const {data: allRoles = []} = useGetRolesQuery()
  const [updateAccess] = useUpdateSharedNodeAccessMutation()
  const [selectedUserIDs, setSelectedUserIDs] = useState<string[]>([])
  const [selectedGroupIDs, setSelectedGroupIDs] = useState<string[]>([])
  const [selectedAudienceRoleIDs, setSelectedAudienceRoleIDs] = useState<
    string[]
  >([])
  const [access, setAccess] = useState<SharedNodeAccessDetails>()
  const [managedRoles, setManagedRoles] = useState<ManagedRole>()

  useEffect(() => {
    if (initialData) {
      setAccess({
        ...initialData,
        audience_roles: initialData.audience_roles ?? []
      })
    }
  }, [initialData])

  const onUserSelectionChange = (user_id: string, checked: boolean) => {
    if (checked) {
      setSelectedUserIDs([...selectedUserIDs, user_id])
    } else {
      const newSelIDs = selectedUserIDs.filter(id => id != user_id)
      setSelectedUserIDs(newSelIDs)
    }
  }

  const onGroupSelectionChange = (group_id: string, checked: boolean) => {
    if (checked) {
      setSelectedGroupIDs([...selectedGroupIDs, group_id])
    } else {
      const newSelIDs = selectedGroupIDs.filter(id => id != group_id)
      setSelectedGroupIDs(newSelIDs)
    }
  }

  const onAudienceSelectionChange = (audience_id: string, checked: boolean) => {
    if (checked) {
      setSelectedAudienceRoleIDs([...selectedAudienceRoleIDs, audience_id])
    } else {
      setSelectedAudienceRoleIDs(
        selectedAudienceRoleIDs.filter(id => id != audience_id)
      )
    }
  }

  const localSubmit = async () => {
    const accessData = getAccessData4BE({access, node_id})
    await updateAccess(accessData)
    stack.closeAll()
    onClose()
  }

  const localCancel = () => {
    stack.closeAll()
    onClose()
  }

  const onClickViewRole = () => {
    stack.open("manage-role")
  }

  const onClickDeleteRole = (selectedIDs: string[], idType: IDType) => {
    if (idType == "user") {
      if (access) {
        const nextDataState = produce(access, draft => {
          const newUsers = draft.users.filter(u => !selectedIDs.includes(u.id))
          draft.users = newUsers
        })
        setAccess(nextDataState)
      }
      setSelectedUserIDs([])
    } else if (idType == "group") {
      if (access) {
        const nextDataState = produce(access, draft => {
          const newGroups = draft.groups.filter(
            g => !selectedIDs.includes(g.id)
          )
          draft.groups = newGroups
        })
        setAccess(nextDataState)
      }
      setSelectedGroupIDs([])
    } else if (idType == "audience_role") {
      if (access) {
        const nextDataState = produce(access, draft => {
          draft.audience_roles = draft.audience_roles.filter(
            a => !selectedIDs.includes(a.id)
          )
        })
        setAccess(nextDataState)
      }
      setSelectedAudienceRoleIDs([])
    }
  }

  const onCancelRoleView = () => {
    stack.close("manage-role")
    setSelectedUserIDs([])
    setSelectedGroupIDs([])
    setSelectedAudienceRoleIDs([])
  }

  const onSubmitRoleView = () => {
    stack.close("manage-role")
    /* managedRoles.roles is only a list of strings, we need role IDs as well */

    if (managedRoles && access) {
      const newRolesWithIDs = allRoles?.filter(r =>
        managedRoles.roles.includes(r.name)
      )

      if (managedRoles.idType == "group") {
        const changedGroup = access.groups.find(
          g => g.id == managedRoles.selectedID
        )
        if (changedGroup) {
          const nextDataState = produce(access, draft => {
            const oldGroups = draft.groups.filter(g => g.id != changedGroup.id)
            draft.groups = [
              ...oldGroups,
              {
                id: changedGroup.id,
                name: changedGroup.name,
                roles: newRolesWithIDs
              }
            ]
          })
          setAccess(nextDataState)
        }
      } // update for group
      if (managedRoles.idType == "audience_role") {
        const changed = access.audience_roles.find(
          a => a.id == managedRoles.selectedID
        )
        if (changed) {
          const nextDataState = produce(access, draft => {
            const rest = draft.audience_roles.filter(a => a.id != changed.id)
            draft.audience_roles = [
              ...rest,
              {
                id: changed.id,
                name: changed.name,
                roles: newRolesWithIDs
              }
            ]
          })
          setAccess(nextDataState)
        }
      }
      if (managedRoles.idType == "user") {
        const changedUser = access.users.find(
          u => u.id == managedRoles.selectedID
        )
        if (changedUser) {
          const nextDataState = produce(access, draft => {
            const oldUsers = access.users.filter(u => u.id != changedUser.id)
            draft.users = [
              ...oldUsers,
              {
                id: changedUser.id,
                username: changedUser.username,
                roles: newRolesWithIDs
              }
            ]
          })
          setAccess(nextDataState)
        }
      } // update for user
    }
    setSelectedUserIDs([])
    setManagedRoles(undefined)
  }

  const onRoleChanged = (
    selectedID: string,
    idType: IDType,
    value: string[]
  ) => {
    setManagedRoles({
      selectedID,
      idType,
      roles: value
    })
  }

  const onClickTab = () => {
    setSelectedUserIDs([])
    setSelectedGroupIDs([])
    setSelectedAudienceRoleIDs([])
  }

  if (isLoading) {
    return (
      <Modal.Stack>
        <Modal
          {...stack.register("manage-access")}
          title={t("manage_access.title")}
          size={"lg"}
          onClose={localCancel}
        >
          <Container>
            <Loader />
            <Group gap="lg" justify="space-between">
              <Button variant="default" onClick={localCancel}>
                {t("common.cancel")}
              </Button>
              <Button disabled={true}>{t("common.save")}</Button>
            </Group>
          </Container>
        </Modal>
      </Modal.Stack>
    )
  }

  return (
    <Modal.Stack>
      <Modal
        {...stack.register("manage-access")}
        title={t("manage_access.title")}
        size={"lg"}
      >
        <Container>
          <Tabs defaultValue="users">
            <Tabs.List>
              <Tabs.Tab
                value="users"
                onClick={onClickTab}
                leftSection={<IconUsers size={18} />}
              >
                {t("users.name")}
              </Tabs.Tab>
              <Tabs.Tab
                value="groups"
                onClick={onClickTab}
                leftSection={<IconUsersGroup size={18} />}
              >
                {t("groups.name")}
              </Tabs.Tab>
              <Tabs.Tab
                value="audience_roles"
                onClick={onClickTab}
                leftSection={<IconShield size={18} />}
              >
                {t("manage_access.role_audiences")}
              </Tabs.Tab>
            </Tabs.List>
            <Tabs.Panel value="users">
              <ManageAccessUsers
                data={access}
                onSelectionChange={onUserSelectionChange}
                selectedIDs={selectedUserIDs}
                onClickViewButton={onClickViewRole}
                onClickDeleteButton={onClickDeleteRole}
              />
            </Tabs.Panel>
            <Tabs.Panel value="groups">
              <ManageAccessGroups
                data={access}
                onSelectionChange={onGroupSelectionChange}
                selectedIDs={selectedGroupIDs}
                onClickViewButton={onClickViewRole}
                onClickDeleteButton={onClickDeleteRole}
              />
            </Tabs.Panel>
            <Tabs.Panel value="audience_roles">
              <ManageAccessAudienceRoles
                data={access}
                onSelectionChange={onAudienceSelectionChange}
                selectedIDs={selectedAudienceRoleIDs}
                onClickViewButton={onClickViewRole}
                onClickDeleteButton={onClickDeleteRole}
              />
            </Tabs.Panel>
          </Tabs>

          <Group gap="lg" justify="space-between">
            <Button variant="default" onClick={localCancel}>
              {t("common.cancel")}
            </Button>
            <Button
              leftSection={false && <Loader size={"sm"} />}
              onClick={localSubmit}
              disabled={false}
            >
              {t("common.save")}
            </Button>
          </Group>
        </Container>
      </Modal>
      <Modal
        {...stack.register("manage-role")}
        title={t("manage_access.manage_role")}
        size={"lg"}
      >
        <Container>
          <ManageRole
            selectedGroupIDs={selectedGroupIDs}
            selectedUserIDs={selectedUserIDs}
            selectedAudienceRoleIDs={selectedAudienceRoleIDs}
            users={access?.users || []}
            groups={access?.groups || []}
            audienceRoles={access?.audience_roles || []}
            onChange={onRoleChanged}
          />
          <Group gap="lg" justify="space-between">
            <Button variant="default" onClick={onCancelRoleView}>
              {t("common.cancel")}
            </Button>
            <Button
              leftSection={false && <Loader size={"sm"} />}
              onClick={onSubmitRoleView}
              disabled={false}
            >
              {t("common.save")}
            </Button>
          </Group>
        </Container>
      </Modal>
    </Modal.Stack>
  )
}

interface GetAccessData4BEArgs {
  access?: SharedNodeAccessDetails
  node_id: string
}

function getAccessData4BE({
  access,
  node_id
}: GetAccessData4BEArgs): SharedNodeAccessUpdate {
  const result: SharedNodeAccessUpdate = {
    id: node_id,
    users: [],
    groups: [],
    audience_roles: []
  }

  if (!access) {
    return result
  }

  const users: UserUpdate[] = []
  const groups: GroupUpdate[] = []
  const audience_roles: AudienceRoleUpdate[] = []

  for (let i = 0; i < access.users.length; i++) {
    const user: UserUpdate = {
      id: access.users[i].id,
      role_ids: access.users[i].roles.map(r => r.id)
    }
    users.push(user)
  }

  for (let i = 0; i < access.groups.length; i++) {
    const group: GroupUpdate = {
      id: access.groups[i].id,
      role_ids: access.groups[i].roles.map(r => r.id)
    }
    groups.push(group)
  }

  const aud = access.audience_roles ?? []
  for (let i = 0; i < aud.length; i++) {
    const ar: AudienceRoleUpdate = {
      id: aud[i].id,
      role_ids: aud[i].roles.map(r => r.id)
    }
    audience_roles.push(ar)
  }

  return {
    id: node_id,
    users: users,
    groups: groups,
    audience_roles: audience_roles
  }
}
