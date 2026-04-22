import {useAppDispatch} from "@/app/hooks"
import ToggleSecondaryPanel from "@/components/DualPanel/ToggleSecondaryPanel"
import PanelContext from "@/contexts/PanelContext"
import DeletePagesButton from "@/features/document/components/DeletePagesButton"
import EditTitleButton from "@/features/document/components/EditTitleButton"
import {updateActionPanel} from "@/features/ui/uiSlice"
import {Group} from "@mantine/core"
import {useViewportSize} from "@mantine/hooks"
import {useContext, useEffect, useRef} from "react"

import DuplicatePanelButton from "@/components/DualPanel/DuplicatePanelButton"
import LibraryFavoriteToggle from "@/features/library/components/LibraryFavoriteToggle"
import DownloadButton from "@/features/document/components/DownloadButton"
import RotateButton from "@/features/document/components/RotateButton"
import RotateCCButton from "@/features/document/components/RotateCCButton"
import ViewOCRTextButton from "@/features/document/components/ViewOCRTextButton"
import {isBuiltinTextDocument} from "@/features/document/documentPreview"
import {
  useCurrentDoc,
  useCurrentDocVer,
  useSelectedPages
} from "@/features/document/hooks"

interface Args {
  onEditNodeTitleClicked: () => void
  onRotateCWClicked: () => void
  onRotateCCClicked: () => void
  onDeletePagesClicked: () => void
}

export default function ActionButtons({
  onEditNodeTitleClicked,
  onRotateCWClicked,
  onRotateCCClicked,
  onDeletePagesClicked
}: Args) {
  const {height, width} = useViewportSize()
  const dispatch = useAppDispatch()
  const ref = useRef<HTMLDivElement>(null)
  const mode = useContext(PanelContext)
  const {doc} = useCurrentDoc()
  const {docVer} = useCurrentDocVer()
  const selectedPages = useSelectedPages({mode, docVerID: docVer?.id})

  useEffect(() => {
    if (ref?.current) {
      let value = 0
      const styles = window.getComputedStyle(ref?.current)
      value = parseInt(styles.marginTop)
      value += parseInt(styles.marginBottom)
      value += parseInt(styles.paddingBottom)
      value += parseInt(styles.paddingTop)
      value += parseInt(styles.height)
      dispatch(updateActionPanel({mode, value}))
    }
  }, [width, height])

  return (
    <Group ref={ref} justify="space-between">
      <Group>
        <EditTitleButton onClick={onEditNodeTitleClicked} />
        {doc?.id ? <LibraryFavoriteToggle nodeId={doc.id} /> : null}
        {!isBuiltinTextDocument(docVer?.file_name) && <ViewOCRTextButton />}
        <DownloadButton />
        {selectedPages.length > 0 && (
          <RotateButton onClick={onRotateCWClicked} />
        )}
        {selectedPages.length > 0 && (
          <RotateCCButton onClick={onRotateCCClicked} />
        )}
        {selectedPages.length > 0 && (
          <DeletePagesButton onClick={onDeletePagesClicked} />
        )}
      </Group>
      <Group>
        <DuplicatePanelButton />
        <ToggleSecondaryPanel />
      </Group>
    </Group>
  )
}
