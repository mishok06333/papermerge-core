import {
  Anchor,
  Box,
  Group,
  Loader,
  Paper,
  Stack,
  Text,
  ThemeIcon
} from "@mantine/core"
import {IconChevronRight, IconFile, IconFolder} from "@tabler/icons-react"
import {useMemo} from "react"
import {Link, Navigate, useParams} from "react-router-dom"
import {useTranslation} from "react-i18next"

import PostAuthRedirect from "@/features/auth/PostAuthRedirect"
import PublicBreadcrumbs from "@/features/public/components/PublicBreadcrumbs"
import {buildPublicTrail} from "@/features/public/buildPublicTrail"
import {hasAuthCookie} from "@/features/public/guestMode"
import {
  useGetPublicCatalogRootQuery,
  useGetPublicFolderQuery,
  useGetPublicPaginatedNodesQuery
} from "@/features/public/publicApiSlice"
import classes from "@/features/portal/catalogPage.module.css"
import {formatNodeDisplayTitle} from "@/utils"

export default function PublicCatalogPage() {
  if (hasAuthCookie()) {
    return <PostAuthRedirect />
  }

  return <PublicCatalogPageGuest />
}

function PublicCatalogPageGuest() {
  const {t} = useTranslation()
  const {folderId} = useParams<{folderId: string}>()

  const {data: root, isLoading: rootLoading} = useGetPublicCatalogRootQuery()
  const parentId = folderId || root?.id

  const {data: folderMeta} = useGetPublicFolderQuery(parentId ?? "", {
    skip: !parentId
  })

  const {data, isLoading, isError} = useGetPublicPaginatedNodesQuery(
    {nodeID: parentId!, page_size: 100},
    {skip: !parentId}
  )

  const catalogItems = data?.items ?? []

  const trail = useMemo(() => {
    if (!parentId) {
      return []
    }
    return buildPublicTrail(
      folderMeta?.breadcrumb,
      root?.id,
      {
        id: parentId,
        title: folderMeta?.title ?? root?.title ?? ""
      },
      t("portal.root_folder")
    )
  }, [folderMeta?.breadcrumb, folderMeta?.title, root, parentId, t])

  if (!folderId && root) {
    return <Navigate to={`/browse/folder/${root.id}`} replace />
  }

  if (rootLoading || !parentId) {
    return <Loader p="md" />
  }

  if (isLoading) {
    return <Loader p="md" />
  }

  if (isError || !data) {
    return (
      <Text p="md" c="dimmed">
        {t("public.browse.forbidden")}
      </Text>
    )
  }

  return (
    <Group align="stretch" wrap="nowrap" gap="md" p="md" className={classes.page}>
      <Stack gap="md" className={classes.column}>
        <Box className={classes.header}>
          <PublicBreadcrumbs trail={trail} />
        </Box>

        {catalogItems.length === 0 ? (
          <Paper withBorder p="xl" radius="md">
            <Text c="dimmed" ta="center">
              {t("portal.folder_empty")}
            </Text>
          </Paper>
        ) : (
          <Stack gap="sm" className={classes.list}>
            {catalogItems.map(row => {
              const isFolder = row.ctype === "folder"
              return (
                <Paper
                  key={row.id}
                  withBorder
                  p="sm"
                  radius="md"
                  shadow="xs"
                  styles={{
                    root: {
                      transition: "background-color 120ms ease",
                      "&:hover": {
                        backgroundColor: "var(--mantine-color-default-hover)"
                      }
                    }
                  }}
                >
                  <Anchor
                    component={Link}
                    to={
                      isFolder
                        ? `/browse/folder/${row.id}`
                        : `/browse/document/${row.id}`
                    }
                    underline="never"
                    c="var(--mantine-color-text)"
                    display="block"
                  >
                    <Group wrap="nowrap" gap="md" justify="space-between">
                      <Group wrap="nowrap" gap="md" style={{minWidth: 0}}>
                        <ThemeIcon
                          variant="light"
                          color={isFolder ? "yellow" : "gray"}
                          size="lg"
                          radius="md"
                          aria-hidden
                        >
                          {isFolder ? (
                            <IconFolder size={20} stroke={1.5} />
                          ) : (
                            <IconFile size={20} stroke={1.5} />
                          )}
                        </ThemeIcon>
                        <Text fw={500} size="md" truncate="end">
                          {formatNodeDisplayTitle(row.title, row.ctype)}
                        </Text>
                      </Group>
                      {isFolder ? (
                        <IconChevronRight
                          size={18}
                          stroke={1.5}
                          color="var(--mantine-color-dimmed)"
                          style={{flexShrink: 0}}
                          aria-hidden
                        />
                      ) : null}
                    </Group>
                  </Anchor>
                </Paper>
              )
            })}
          </Stack>
        )}
      </Stack>
    </Group>
  )
}
