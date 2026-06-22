import {
  DOCUMENT_TYPE_VIEW,
  NODE_VIEW,
  PORTAL_FEED_VIEW,
  PORTAL_VIEW,
  canManageDocumentTypes,
  canManageTags
} from "@/scopes"

/** First screen after login — portal home when the user may browse the catalog. */
export function resolveDefaultPath(scopes: string[]): string {
  if (scopes.includes(PORTAL_VIEW)) {
    return "/portal"
  }
  if (scopes.includes(NODE_VIEW)) {
    return "/library/favorites"
  }
  if (scopes.includes(PORTAL_FEED_VIEW)) {
    return "/portal/feed"
  }
  if (canManageTags(scopes)) {
    return "/tags"
  }
  if (scopes.includes(DOCUMENT_TYPE_VIEW) || canManageDocumentTypes(scopes)) {
    return "/document-types/"
  }
  return "/portal"
}
