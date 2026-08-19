import {apiSlice} from "@/features/api/slice"
import type {FolderType, NodeType, Paginated} from "@/types"
import {PAGINATION_DEFAULT_ITEMS_PER_PAGES} from "@/cconstants"
import type {BreadcrumbType} from "@/types"

export type PublicCatalogRoot = {
  id: string
  title: string
}

export type PublicDocumentMeta = {
  id: string
  title: string
  parent_id: string
  file_name: string
  breadcrumb: BreadcrumbType
}

export type PublicPaginatedArgs = {
  nodeID: string
  page_number?: number
  page_size?: number
  filter?: string | null
}

function fixPublicThumbnails(items: NodeType[]): NodeType[] {
  return items.map(item => {
    if (item.ctype !== "document") {
      return item
    }
    return {
      ...item,
      thumbnail_url: `/api/public/thumbnails/${item.id}`
    }
  })
}

export const publicApiSlice = apiSlice.injectEndpoints({
  endpoints: builder => ({
    getPublicCatalogRoot: builder.query<PublicCatalogRoot, void>({
      query: () => "/public/library/root"
    }),
    getPublicPaginatedNodes: builder.query<
      Paginated<NodeType>,
      PublicPaginatedArgs
    >({
      query: ({
        nodeID,
        page_number = 1,
        page_size = PAGINATION_DEFAULT_ITEMS_PER_PAGES,
        filter = undefined
      }) => {
        if (!filter) {
          return `/public/nodes/${nodeID}?page_number=${page_number}&page_size=${page_size}`
        }
        return `/public/nodes/${nodeID}?page_size=${page_size}&filter=${filter}`
      },
      transformResponse: (response: Paginated<NodeType>) => ({
        ...response,
        items: fixPublicThumbnails(response.items)
      })
    }),
    getPublicFolder: builder.query<FolderType, string>({
      query: folderID => `/public/folders/${folderID}`
    }),
    getPublicDocument: builder.query<PublicDocumentMeta, string>({
      query: documentID => `/public/documents/${documentID}`
    })
  })
})

export const {
  useGetPublicCatalogRootQuery,
  useGetPublicPaginatedNodesQuery,
  useGetPublicFolderQuery,
  useGetPublicDocumentQuery
} = publicApiSlice
