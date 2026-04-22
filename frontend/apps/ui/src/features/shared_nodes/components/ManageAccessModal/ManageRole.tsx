import {useGetRolesQuery} from "@/features/roles/apiSlice"
import type {AudienceRole, Group, User} from "@/types.d/shared_nodes"
import {MultiSelect} from "@mantine/core"
import {useEffect, useState} from "react"
import {useTranslation} from "react-i18next"
import type {IDType} from "./type"

interface Args {
  selectedUserIDs: string[]
  selectedGroupIDs: string[]
  selectedAudienceRoleIDs: string[]
  users: User[]
  groups: Group[]
  audienceRoles: AudienceRole[]
  onChange: (sel_id: string, id_type: IDType, new_roles: string[]) => void
}

export default function ManageRole({
  selectedGroupIDs,
  selectedUserIDs,
  selectedAudienceRoleIDs,
  users,
  groups,
  audienceRoles,
  onChange
}: Args) {
  const {t} = useTranslation()
  const [roles, setRoles] = useState<string[]>()
  const {data: allRoles = []} = useGetRolesQuery()

  useEffect(() => {
    const roles = getCurrentRoles({
      groupIDs: selectedGroupIDs,
      userIDs: selectedUserIDs,
      audienceRoleIDs: selectedAudienceRoleIDs,
      users,
      groups,
      audienceRoles
    })
    setRoles(roles)
  }, [selectedGroupIDs, selectedUserIDs, selectedAudienceRoleIDs])

  const onLocalRoleChange = (value: string[]) => {
    const idType = getIDType({
      groupIDs: selectedGroupIDs,
      userIDs: selectedUserIDs,
      audienceRoleIDs: selectedAudienceRoleIDs
    })
    setRoles(value)
    if (idType == "user") {
      onChange(selectedUserIDs[0], "user", value)
    } else if (idType == "group") {
      onChange(selectedGroupIDs[0], "group", value)
    } else if (idType == "audience_role") {
      onChange(selectedAudienceRoleIDs[0], "audience_role", value)
    }
  }

  return (
    <MultiSelect
      label={t("roles.name")}
      placeholder={t("common.pick_value")}
      onChange={onLocalRoleChange}
      value={roles}
      data={allRoles.map(r => r.name) || []}
    />
  )
}

interface GetCurrentRolesArgs {
  groupIDs: string[]
  userIDs: string[]
  audienceRoleIDs: string[]
  groups: Group[]
  users: User[]
  audienceRoles: AudienceRole[]
}

function getCurrentRoles({
  groupIDs,
  userIDs,
  audienceRoleIDs,
  users,
  groups,
  audienceRoles
}: GetCurrentRolesArgs): string[] {
  const idType = getIDType({groupIDs, userIDs, audienceRoleIDs})

  if (idType == "group") {
    const sel_id = groupIDs[0]
    if (sel_id) {
      const found = groups.find(g => g.id == sel_id)
      if (found) {
        return found.roles.map(r => r.name)
      }
    }
  }
  if (idType == "user") {
    const sel_id = userIDs[0]
    if (sel_id) {
      const found = users.find(u => u.id == sel_id)
      if (found) {
        return found.roles.map(r => r.name)
      }
    }
  }
  if (idType == "audience_role") {
    const sel_id = audienceRoleIDs[0]
    if (sel_id) {
      const found = audienceRoles.find(a => a.id == sel_id)
      if (found) {
        return found.roles.map(r => r.name)
      }
    }
  }

  return []
}

interface GetIDTypeArgs {
  groupIDs: string[]
  userIDs: string[]
  audienceRoleIDs: string[]
}

function getIDType({
  groupIDs,
  userIDs,
  audienceRoleIDs
}: GetIDTypeArgs): IDType | undefined {
  if (audienceRoleIDs && audienceRoleIDs.length == 1) {
    return "audience_role"
  }
  if (groupIDs && groupIDs.length == 1) {
    return "group"
  }

  if (userIDs && userIDs.length == 1) {
    return "user"
  }

  console.warn("getIDType returns undefined")
  return undefined
}
