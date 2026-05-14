import {Anchor, Breadcrumbs, Group, Skeleton} from "@mantine/core"
import {IconFolder} from "@tabler/icons-react"

import type {NType} from "@/types"

type Args = {
  items?: Array<[string, string]> | null
  pageNumber?: number | null
  onClick: (n: NType) => void
}

export default function Path({items, onClick, pageNumber}: Args) {
  if (!items) {
    return <Skeleton height={18} width={45} />
  }

  if (items.length == 0) {
    return <Skeleton height={18} width={45} />
  }

  if (items.length == 1) {
    return (
      <Breadcrumbs>
        <RootItem
          itemId={items[0][0]}
          rootTitle={items[0][1]}
          onClick={onClick}
        />
        {pageNumber && pageNumber > 1 && `Page ${pageNumber}`}
      </Breadcrumbs>
    )
  }
  const links = items.slice(1).map(i => (
    <Anchor onClick={() => onClick({id: i[0], ctype: "folder"})} key={i[0]}>
      {i[1]}
    </Anchor>
  ))

  return (
    <Breadcrumbs>
      <RootItem
        itemId={items[0][0]}
        rootTitle={items[0][1]}
        onClick={onClick}
      />
      {links}
      {pageNumber && pageNumber > 1 && `Page ${pageNumber}`}
    </Breadcrumbs>
  )
}

type RootItemArgs = {
  itemId: string
  rootTitle: string
  onClick: (n: NType) => void
}

function RootItem({itemId, rootTitle, onClick}: RootItemArgs) {
  return (
    <Anchor onClick={() => onClick({id: itemId, ctype: "folder"})}>
      <Group>
        <IconFolder />
        {rootTitle}
      </Group>
    </Anchor>
  )
}
