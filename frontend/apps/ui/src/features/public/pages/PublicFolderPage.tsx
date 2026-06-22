import {
  Anchor,
  Breadcrumbs,
  Container,
  Group,
  Loader,
  Pagination,
  Stack,
  Text
} from "@mantine/core"
import {IconFolder} from "@tabler/icons-react"
import {useTranslation} from "react-i18next"
import {Link, Navigate, useNavigate, useParams} from "react-router-dom"
import {useState} from "react"

import PublicHeader from "@/features/public/components/PublicHeader"
import PublicNodesList from "@/features/public/components/PublicNodesList"
import {hasAuthCookie} from "@/features/public/guestMode"
import {
  useGetPublicFolderQuery,
  useGetPublicPaginatedNodesQuery
} from "@/features/public/publicApiSlice"
import type {NodeType} from "@/types"
import {PAGINATION_DEFAULT_ITEMS_PER_PAGES} from "@/cconstants"

export default function PublicFolderPage() {
  const {t} = useTranslation()
  const {folderId} = useParams()
  const navigate = useNavigate()
  const [pageNumber, setPageNumber] = useState(1)

  if (hasAuthCookie()) {
    return <Navigate to={`/folder/${folderId}`} replace />
  }

  if (!folderId) {
    return <Navigate to="/" replace />
  }

  const {data: folder, isLoading: folderLoading, isError} =
    useGetPublicFolderQuery(folderId)

  const {data: nodes, isLoading: nodesLoading} = useGetPublicPaginatedNodesQuery({
    nodeID: folderId,
    page_number: pageNumber,
    page_size: PAGINATION_DEFAULT_ITEMS_PER_PAGES
  })

  const onFolderClick = (node: NodeType) => {
    navigate(`/browse/folder/${node.id}`)
  }

  const onDocumentClick = (node: NodeType) => {
    navigate(`/browse/document/${node.id}`)
  }

  if (isError) {
    return (
      <Stack gap={0} mih="100vh">
        <PublicHeader />
        <Container py="md">
          <Text c="dimmed">{t("public.browse.forbidden")}</Text>
        </Container>
      </Stack>
    )
  }

  return (
    <Stack gap={0} mih="100vh">
      <PublicHeader />
      <Container size="lg" py="md">
        <Stack gap="md">
          {folderLoading && <Loader />}
          {folder && (
            <>
              <Breadcrumbs>
                <Anchor component={Link} to="/">
                  {t("public.landing.title")}
                </Anchor>
                {folder.breadcrumb?.map(([id, title]) => (
                  <Anchor
                    key={id}
                    component={Link}
                    to={`/browse/folder/${id}`}
                  >
                    {title}
                  </Anchor>
                ))}
                <Group gap={4}>
                  <IconFolder size={14} />
                  <Text size="sm">{folder.title}</Text>
                </Group>
              </Breadcrumbs>
              <Text fw={600}>{folder.title}</Text>
            </>
          )}
          {nodesLoading && <Loader size="sm" />}
          {nodes && nodes.items.length > 0 && (
            <PublicNodesList
              items={nodes.items}
              onFolderClick={onFolderClick}
              onDocumentClick={onDocumentClick}
            />
          )}
          {nodes && nodes.items.length === 0 && !nodesLoading && (
            <Text c="dimmed">{t("public.browse.empty")}</Text>
          )}
          {nodes && nodes.num_pages > 1 && (
            <Pagination
              value={pageNumber}
              total={nodes.num_pages}
              onChange={setPageNumber}
            />
          )}
        </Stack>
      </Container>
    </Stack>
  )
}
