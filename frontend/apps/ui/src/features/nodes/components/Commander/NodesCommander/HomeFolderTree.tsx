import {
  Box,
  Group,
  Loader,
  ScrollArea,
  Text,
  Tree,
  type RenderTreeNodePayload,
  type TreeNodeData,
  useTree
} from "@mantine/core"
import {
  IconChevronRight,
  IconFile,
  IconFolder
} from "@tabler/icons-react"
import {useCallback, useEffect, useRef, useState} from "react"
import {useTranslation} from "react-i18next"
import {useNavigate} from "react-router-dom"

import {useLazyGetPaginatedNodesQuery} from "@/features/nodes/apiSlice"
import type {NodeType} from "@/types"

import classes from "./HomeFolderTree.module.scss"

function replaceFolderChildren(
  nodes: TreeNodeData[],
  folderId: string,
  newChildren: TreeNodeData[]
): TreeNodeData[] {
  return nodes.map(n => {
    if (n.value === folderId) {
      return {...n, children: newChildren}
    }
    if (n.children?.length) {
      return {
        ...n,
        children: replaceFolderChildren(n.children, folderId, newChildren)
      }
    }
    return n
  })
}

function getFlatValues(data: TreeNodeData[]): string[] {
  return data.reduce<string[]>((acc, item) => {
    acc.push(item.value)
    if (item.children?.length) {
      acc.push(...getFlatValues(item.children))
    }
    return acc
  }, [])
}

type Props = {
  homeRootId: string
  rootLabel: string
  currentNodeID: string
  lastPageSize: number
  height: number
}

export default function HomeFolderTree({
  homeRootId,
  rootLabel,
  currentNodeID,
  lastPageSize,
  height
}: Props) {
  const {t} = useTranslation()
  const navigate = useNavigate()
  const [trigger] = useLazyGetPaginatedNodesQuery()
  const loadedRef = useRef(new Set<string>())
  const loadingRef = useRef(new Set<string>())
  const [treeData, setTreeData] = useState<TreeNodeData[]>([])
  const [rootLoading, setRootLoading] = useState(true)

  const fetchAllPages = useCallback(
    async (parentId: string) => {
      const all: NodeType[] = []
      let page = 1
      let numPages = 1
      do {
        const res = await trigger({
          nodeID: parentId,
          page_number: page,
          page_size: 100,
          sortDir: "az",
          sortColumn: "title"
        }).unwrap()
        all.push(...res.items)
        numPages = res.num_pages
        page++
      } while (page <= numPages)
      return all
    },
    [trigger]
  )

  const nodeToTreeData = useCallback((n: NodeType): TreeNodeData => {
    if (n.ctype === "document") {
      return {
        value: n.id,
        label: n.title,
        nodeProps: {"data-ctype": "document"}
      }
    }
    return {
      value: n.id,
      label: n.title,
      nodeProps: {"data-ctype": "folder"},
      children: [
        {
          value: `__lazy__${n.id}`,
          label: "\u200b",
          nodeProps: {"data-placeholder": "true"}
        }
      ]
    }
  }, [])

  const ensureLoaded = useCallback(
    async (folderId: string) => {
      if (
        loadedRef.current.has(folderId) ||
        loadingRef.current.has(folderId)
      ) {
        return
      }
      loadingRef.current.add(folderId)
      try {
        const items = await fetchAllPages(folderId)
        loadedRef.current.add(folderId)
        const mapped =
          items.length > 0 ? items.map(nodeToTreeData) : undefined
        setTreeData(prev => replaceFolderChildren(prev, folderId, mapped ?? []))
      } finally {
        loadingRef.current.delete(folderId)
      }
    },
    [fetchAllPages, nodeToTreeData]
  )

  const ensureLoadedRef = useRef(ensureLoaded)
  ensureLoadedRef.current = ensureLoaded

  const tree = useTree({
    onNodeExpand: (value: string) => {
      void ensureLoadedRef.current(value)
    }
  })

  const treeRef = useRef(tree)
  treeRef.current = tree

  useEffect(() => {
    loadedRef.current.clear()
    loadingRef.current.clear()
    setTreeData([])
    setRootLoading(true)
    let cancelled = false
    ;(async () => {
      try {
        const items = await fetchAllPages(homeRootId)
        if (cancelled) {
          return
        }
        loadedRef.current.add(homeRootId)
        setTreeData([
          {
            value: homeRootId,
            label: rootLabel,
            nodeProps: {"data-ctype": "folder"},
            children: items.map(nodeToTreeData)
          }
        ])
      } catch {
        if (!cancelled) {
          setTreeData([])
        }
      } finally {
        if (!cancelled) {
          setRootLoading(false)
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [homeRootId, rootLabel, fetchAllPages, nodeToTreeData])

  useEffect(() => {
    if (!treeData.length) {
      return
    }
    const flat = getFlatValues(treeData)
    if (!flat.includes(currentNodeID)) {
      return
    }
    const ctl = treeRef.current
    if (ctl.selectedState.includes(currentNodeID)) {
      return
    }
    ctl.select(currentNodeID)
    /* `useTree` returns a new controller object every render; never put `tree`
       in this dependency list or `tree.select` runs every frame (infinite loop). */
  }, [currentNodeID, treeData])

  const onTreeNavigate = useCallback(
    (node: TreeNodeData) => {
      const ctype = node.nodeProps?.["data-ctype"]
      if (ctype === "document") {
        navigate(`/document/${node.value}`)
        return
      }
      navigate(`/folder/${node.value}?page_size=${lastPageSize}`)
    },
    [navigate, lastPageSize]
  )

  const renderTreeNode = useCallback(
    ({
      node,
      expanded,
      hasChildren,
      elementProps,
      tree: tctl
    }: RenderTreeNodePayload) => {
      if (node.nodeProps?.["data-placeholder"] === "true") {
        return (
          <span
            className={classes.placeholder}
            {...elementProps}
            aria-hidden
          />
        )
      }
      const ctype = node.nodeProps?.["data-ctype"]
      const isFolder = ctype === "folder"
      return (
        <Group
          gap={6}
          wrap="nowrap"
          className={classes.row}
          {...elementProps}
        >
          {hasChildren ? (
            <Box
              className={classes.chevron}
              onClick={e => {
                e.stopPropagation()
                tctl.toggleExpanded(node.value)
              }}
            >
              <IconChevronRight
                size={14}
                style={{
                  transform: expanded ? "rotate(90deg)" : undefined,
                  flexShrink: 0
                }}
              />
            </Box>
          ) : (
            <Box w={14} flex="0 0 14px" />
          )}
          <Box
            className={classes.label}
            onClick={e => {
              e.stopPropagation()
              tctl.select(node.value)
              onTreeNavigate(node)
            }}
          >
            <Group gap={6} wrap="nowrap">
              {isFolder ? (
                <IconFolder size={14} className={classes.folderIcon} />
              ) : (
                <IconFile size={14} className={classes.fileIcon} />
              )}
              <Text size="sm" truncate="end" title={String(node.label)}>
                {node.label}
              </Text>
            </Group>
          </Box>
        </Group>
      )
    },
    [onTreeNavigate]
  )

  return (
    <Box className={classes.sidebar}>
      <Text size="sm" fw={600} mb="xs" px="xs">
        {t("home.name")}
      </Text>
      <ScrollArea h={height} type="scroll">
        {rootLoading ? (
          <Loader size="sm" ml="xs" />
        ) : (
          <Tree
            tree={tree}
            data={treeData}
            expandOnClick={false}
            selectOnClick={false}
            className={classes.tree}
            renderNode={renderTreeNode}
          />
        )}
      </ScrollArea>
    </Box>
  )
}
