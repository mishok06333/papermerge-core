import {Button, Container, Loader, Stack, Text, Title} from "@mantine/core"
import {useTranslation} from "react-i18next"
import {Link, Navigate} from "react-router-dom"

import PublicHeader from "@/features/public/components/PublicHeader"
import {
  useGetPublicCatalogRootQuery,
  useGetPublicPaginatedNodesQuery
} from "@/features/public/publicApiSlice"
import {hasAuthCookie} from "@/features/public/guestMode"
import PublicNodesList from "@/features/public/components/PublicNodesList"
import type {NodeType} from "@/types"

export default function PublicLandingPage() {
  const {t} = useTranslation()

  if (hasAuthCookie()) {
    return <Navigate to="/library/favorites" replace />
  }

  const {data: root, isLoading: rootLoading, isError: rootError} =
    useGetPublicCatalogRootQuery()

  const {data: nodes, isLoading: nodesLoading} = useGetPublicPaginatedNodesQuery(
    {nodeID: root?.id ?? "", page_size: 12},
    {skip: !root?.id}
  )

  const onFolderClick = (node: NodeType) => {
    window.location.href = `/browse/folder/${node.id}`
  }

  const onDocumentClick = (node: NodeType) => {
    window.location.href = `/browse/document/${node.id}`
  }

  return (
    <Stack gap={0} mih="100vh">
      <PublicHeader />
      <Container size="lg" py="xl">
        <Stack gap="lg">
          <Stack gap="xs">
            <Title order={2}>{t("public.landing.hero")}</Title>
            <Text c="dimmed">{t("public.landing.subtitle")}</Text>
          </Stack>

          {rootLoading && <Loader />}
          {rootError && (
            <Text c="dimmed">{t("public.landing.catalog_unconfigured")}</Text>
          )}

          {root && (
            <Stack gap="md">
              <GroupBrowseLink rootId={root.id} rootTitle={root.title} />
              {nodesLoading && <Loader size="sm" />}
              {nodes && nodes.items.length > 0 && (
                <PublicNodesList
                  items={nodes.items}
                  onFolderClick={onFolderClick}
                  onDocumentClick={onDocumentClick}
                />
              )}
              {nodes && nodes.items.length === 0 && (
                <Text c="dimmed">{t("public.landing.empty")}</Text>
              )}
            </Stack>
          )}
        </Stack>
      </Container>
    </Stack>
  )
}

function GroupBrowseLink({
  rootId,
  rootTitle
}: {
  rootId: string
  rootTitle: string
}) {
  const {t} = useTranslation()
  return (
    <Button component={Link} to={`/browse/folder/${rootId}`} variant="light">
      {t("public.landing.browse_catalog", {title: rootTitle})}
    </Button>
  )
}
