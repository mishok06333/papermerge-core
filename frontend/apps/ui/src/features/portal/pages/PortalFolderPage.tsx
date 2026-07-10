import {useAppDispatch, useAppSelector} from "@/app/hooks"
import {useGetFolderQuery} from "@/features/nodes/apiSlice"
import PortalFolderTree from "@/features/portal/components/PortalFolderTree"
import {useGetPortalNodesQuery, useGetPortalRootQuery} from "@/features/portal/portalApiSlice"
import {makePortalDocumentNavState} from "@/features/portal/portalNavState"
import {COMMANDER_VIEW} from "@/scopes"
import {selectCurrentUser} from "@/slices/currentUser"
import type {BreadcrumbType, NodeType, UserDetails} from "@/types"
import {formatNodeDisplayTitle} from "@/utils"
import {
  homeFolderTreeToggled,
  selectHomeFolderTreeOpen,
  selectHomeFolderTreeSidebarHeight
} from "@/features/ui/uiSlice"
import breadcrumbClasses from "@/components/Breadcrumbs/Breadcrumbs.module.css"
import {
  Anchor,
  Box,
  Breadcrumbs,
  Button,
  Group,
  Loader,
  Paper,
  Stack,
  Switch,
  Text,
  ThemeIcon
} from "@mantine/core"
import {IconChevronRight, IconFile, IconFolder} from "@tabler/icons-react"
import {useMemo} from "react"
import {useSelector} from "react-redux"
import {Link, useParams} from "react-router-dom"
import {useTranslation} from "react-i18next"

function sortPortalItems(items: NodeType[]): NodeType[] {
  return [...items].sort((a, b) => {
    if (a.ctype !== b.ctype) {
      return a.ctype === "folder" ? -1 : 1
    }
    return a.title.localeCompare(b.title, undefined, {sensitivity: "base"})
  })
}

function portalBreadcrumbTrail(
  crumb: BreadcrumbType | undefined,
  portalRootId: string | undefined
): BreadcrumbType {
  if (!crumb?.length) {
    return []
  }
  if (!portalRootId) {
    return crumb
  }
  const idx = crumb.findIndex(([id]) => id === portalRootId)
  if (idx >= 0) {
    return crumb.slice(idx)
  }
  return crumb
}

export default function PortalFolderPage() {
  const {t} = useTranslation()
  const dispatch = useAppDispatch()
  const {folderId} = useParams<{folderId: string}>()
  const user = useSelector(selectCurrentUser) as UserDetails | null
  const scopes = user?.scopes ?? []
  // `p="md"` on the page group — subtract top + bottom padding from sidebar height.
  const treeHeight = useAppSelector(s => selectHomeFolderTreeSidebarHeight(s) - 32)
  const portalFolderTreeOpen = useAppSelector(selectHomeFolderTreeOpen)

  const {data: root} = useGetPortalRootQuery()
  const parentId = folderId || root?.id

  const {data: folderMeta} = useGetFolderQuery(parentId ?? "", {
    skip: !parentId
  })

  const documentNavState = useMemo(
    () => (root ? makePortalDocumentNavState(root) : null),
    [root]
  )

  const {data, isLoading, error} = useGetPortalNodesQuery(
    {parentId: parentId!, page_size: 100},
    {skip: !parentId}
  )

  const sortedItems = useMemo(
    () => (data?.items ? sortPortalItems(data.items) : []),
    [data?.items]
  )

  const trail = useMemo(() => {
    const rootTitle = (id: string, title: string) =>
      root && id === root.id ? t("portal.root_folder") : title
    const computed = portalBreadcrumbTrail(folderMeta?.breadcrumb, root?.id)
    if (computed.length > 0) {
      return computed.map(
        ([id, title]) => [id, rootTitle(id, title)] as [string, string]
      ) as BreadcrumbType
    }
    if (root && parentId === root.id) {
      return [[root.id, t("portal.root_folder")]] as BreadcrumbType
    }
    return []
  }, [folderMeta?.breadcrumb, root, parentId, t])

  if (!parentId) {
    return <Loader />
  }

  if (isLoading) {
    return <Loader />
  }

  if (error || !data) {
    return (
      <Text p="md" c="red">
        {t("portal.load_error")}
      </Text>
    )
  }

  const showCommanderLink = scopes.includes(COMMANDER_VIEW)

  const showTree = root && documentNavState && portalFolderTreeOpen

  return (
    <Group align="flex-start" wrap="nowrap" gap="md" p="md">
      {showTree ? (
        <PortalFolderTree
          portalRootId={root.id}
          portalRootTitle={t("portal.root_folder")}
          currentFolderId={parentId}
          height={treeHeight}
          documentNavState={documentNavState}
        />
      ) : null}
      <Stack gap="md" style={{flex: 1, minWidth: 0}}>
        <Group justify="space-between" align="center" wrap="wrap" gap="sm">
          <Box style={{flex: 1, minWidth: 0}}>
            {trail.length > 0 ? (
              <Breadcrumbs
                separator="›"
                className={breadcrumbClasses.breadcrumbs}
              >
                {trail.map(([id, title], index) => {
                  const isLast = index === trail.length - 1
                  return isLast ? (
                    <Anchor key={id} title={title} fw={600}>
                      {title}
                    </Anchor>
                  ) : (
                    <Anchor
                      key={id}
                      component={Link}
                      to={`/portal/folder/${id}`}
                      title={title}
                    >
                      {title}
                    </Anchor>
                  )
                })}
              </Breadcrumbs>
            ) : null}
          </Box>
          <Group wrap="nowrap" gap="sm">
            {root && documentNavState ? (
              <Switch
                size="xs"
                label={t("homeFolderTree.show")}
                checked={portalFolderTreeOpen}
                onChange={() => dispatch(homeFolderTreeToggled())}
              />
            ) : null}
            {showCommanderLink ? (
              <Button component={Link} to={`/folder/${parentId}`}>
                {t("portal.manage_in_commander")}
              </Button>
            ) : null}
          </Group>
        </Group>

        {sortedItems.length === 0 ? (
          <Paper withBorder p="xl" radius="md">
            <Text c="dimmed" ta="center">
              {t("portal.folder_empty")}
            </Text>
          </Paper>
        ) : (
          <Stack gap="sm">
            {sortedItems.map(row => {
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
                        ? `/portal/folder/${row.id}`
                        : `/document/${row.id}`
                    }
                    state={isFolder ? undefined : documentNavState ?? undefined}
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
