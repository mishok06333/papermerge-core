import {SimpleGrid, Stack, Text, UnstyledButton} from "@mantine/core"
import {IconFolder, IconWorld} from "@tabler/icons-react"
import type {NodeType} from "@/types"
import {formatNodeDisplayTitle} from "@/utils"

type Props = {
  items: NodeType[]
  onFolderClick: (node: NodeType) => void
  onDocumentClick: (node: NodeType) => void
}

function VisibilityBadge({summary}: {summary?: string | null}) {
  if (summary === "public") {
    return <IconWorld size={14} style={{marginLeft: 4}} />
  }
  return null
}

export default function PublicNodesList({
  items,
  onFolderClick,
  onDocumentClick
}: Props) {
  return (
    <SimpleGrid cols={{base: 2, sm: 3, md: 4, lg: 6}} spacing="md">
      {items.map(node => (
        <UnstyledButton
          key={node.id}
          onClick={() =>
            node.ctype === "folder"
              ? onFolderClick(node)
              : onDocumentClick(node)
          }
          style={{
            border: "1px solid var(--mantine-color-gray-3)",
            borderRadius: 8,
            padding: 12
          }}
        >
          <Stack gap={4} align="center">
            {node.ctype === "folder" ? (
              <IconFolder size={48} stroke={1.2} />
            ) : node.thumbnail_url ? (
              <img
                src={node.thumbnail_url}
                alt={formatNodeDisplayTitle(node.title, node.ctype)}
                style={{width: 80, height: 100, objectFit: "cover"}}
              />
            ) : (
              <Text size="xs" c="dimmed">
                …
              </Text>
            )}
            <Text size="sm" lineClamp={2} ta="center">
              {formatNodeDisplayTitle(node.title, node.ctype)}
              <VisibilityBadge summary={node.visibility_summary} />
            </Text>
          </Stack>
        </UnstyledButton>
      ))}
    </SimpleGrid>
  )
}
