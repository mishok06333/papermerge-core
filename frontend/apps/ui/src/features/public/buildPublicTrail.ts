import type {BreadcrumbType} from "@/types"

type CurrentCrumb = {
  id: string
  title: string
}

/**
 * Build guest breadcrumb trail: visible ancestors (from catalog root) + current node.
 * Every ancestor is a link target; the last item is the current folder/document.
 */
export function buildPublicTrail(
  ancestors: BreadcrumbType | undefined,
  catalogRootId: string | undefined,
  current: CurrentCrumb,
  rootLabel: string
): BreadcrumbType {
  const rootTitle = (id: string, title: string) =>
    catalogRootId && id === catalogRootId ? rootLabel : title

  const crumb = ancestors ?? []
  let items: BreadcrumbType

  if (catalogRootId) {
    const idx = crumb.findIndex(([id]) => id === catalogRootId)
    items = (idx >= 0 ? crumb.slice(idx) : [...crumb]).map(
      ([id, title]) => [id, rootTitle(id, title)] as [string, string]
    )
  } else {
    items = crumb.map(
      ([id, title]) => [id, rootTitle(id, title)] as [string, string]
    )
  }

  const currentTitle =
    catalogRootId && current.id === catalogRootId ? rootLabel : current.title
  const lastId = items.length > 0 ? items[items.length - 1][0] : null
  if (lastId !== current.id) {
    items.push([current.id, currentTitle])
  }

  return items
}
