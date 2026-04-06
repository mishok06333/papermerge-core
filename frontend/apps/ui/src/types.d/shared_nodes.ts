export type NewSharedNodes = {
  user_ids: string[]
  role_ids: string[]
  group_ids: string[]
  /** Account roles: all users with one of these roles receive the share */
  recipient_role_ids: string[]
  node_ids: string[]
}

export type Role = {
  name: string
  id: string
}

export type User = {
  id: string
  username: string
  roles: Array<Role>
}

export type Group = {
  name: string
  id: string
  roles: Array<Role>
}

export type AudienceRole = {
  name: string
  id: string
  roles: Array<Role>
}

export type UserUpdate = {
  id: string // user id
  role_ids: string[]
}

export type GroupUpdate = {
  id: string // group id
  role_ids: string[]
}

export type AudienceRoleUpdate = {
  id: string
  role_ids: string[]
}

export type SharedNodeAccessDetails = {
  id: string // node ID
  users: Array<User>
  groups: Array<Group>
  audience_roles: Array<AudienceRole>
}

export type SharedNodeAccessUpdate = {
  id: string // node ID
  users: Array<UserUpdate>
  groups: Array<GroupUpdate>
  audience_roles: Array<AudienceRoleUpdate>
}
