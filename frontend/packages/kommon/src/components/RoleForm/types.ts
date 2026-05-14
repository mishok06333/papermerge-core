export interface I18NPermissionTree {
  folders: string
  documents: string
  page_management: string
  categories: string
  shares: string
  /** Legal portal permission group title */
  legal_portal?: string
  portal_feed?: string
  portal_feed_manage?: string
  portal_section_create?: string
  portal_section_update?: string
  portal_section_delete?: string
  portal_document_upload?: string
  portal_document_update?: string
  portal_document_delete?: string
  comments: string
  users: string
  roles: string
  groups: string
  view: string
  create: string
  update: string
  move: string
  delete: string
  download: string
  upload: string
  extract: string
  rotate: string
  reorder: string
  select: string
  all_versions: string
  only_last_version: string
  title: string
  custom_fields: string
  tags: string
  category: string
}

export interface I18NCollapseButton {
  collapseAll: string
  expandAll: string
}

export interface I18NCheckButton {
  checkAll: string
  uncheckAll: string
}
