import ToggleSecondaryPanel from "@/components/DualPanel/ToggleSecondaryPanel"
import {Group} from "@mantine/core"
import DocumentTypeFilter from "./DocumentTypeFilter"

export default function ActionButtons() {
  return (
    <Group justify="space-between">
      <DocumentTypeFilter />
      <Group>
        <ToggleSecondaryPanel />
      </Group>
    </Group>
  )
}
