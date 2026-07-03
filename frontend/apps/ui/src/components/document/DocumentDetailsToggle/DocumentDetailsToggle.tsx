import {useAppDispatch, useAppSelector} from "@/app/hooks"
import PanelContext from "@/contexts/PanelContext"
import {
  selectDocumentDetailsPanelOpen,
  viewerDocumentDetailsPanelToggled
} from "@/features/ui/uiSlice"
import {PanelMode} from "@/types"
import {ActionIcon} from "@mantine/core"
import {
  IconLayoutSidebarRight,
  IconLayoutSidebarRightFilled
} from "@tabler/icons-react"
import {useContext} from "react"

export default function DocumentDetailsToggle() {
  const dispatch = useAppDispatch()
  const mode: PanelMode = useContext(PanelContext)
  const isOpen = useAppSelector(s => selectDocumentDetailsPanelOpen(s, mode))

  const onClick = () => {
    dispatch(viewerDocumentDetailsPanelToggled(mode))
  }

  return (
    <ActionIcon
      size="lg"
      variant="default"
      onClick={onClick}
      aria-pressed={isOpen}
    >
      {isOpen ? (
        <IconLayoutSidebarRightFilled size={18} />
      ) : (
        <IconLayoutSidebarRight size={18} />
      )}
    </ActionIcon>
  )
}
