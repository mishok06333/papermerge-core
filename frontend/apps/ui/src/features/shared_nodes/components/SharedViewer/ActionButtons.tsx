import {useAppDispatch} from "@/app/hooks"
import PanelContext from "@/contexts/PanelContext"
import LibraryFavoriteToggle from "@/features/library/components/LibraryFavoriteToggle"
import {useCurrentSharedDoc} from "@/features/shared_nodes/hooks"
import {updateActionPanel} from "@/features/ui/uiSlice"
import {Group} from "@mantine/core"
import {useViewportSize} from "@mantine/hooks"
import {useContext, useEffect, useRef} from "react"

import type {PanelMode} from "@/types"
import DownloadButton from "./DownloadButton"

export default function ActionButtons() {
  const {height, width} = useViewportSize()
  const dispatch = useAppDispatch()
  const ref = useRef<HTMLDivElement>(null)
  const mode: PanelMode = useContext(PanelContext)
  const {doc} = useCurrentSharedDoc()

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
        <DownloadButton />
        {doc?.id ? <LibraryFavoriteToggle nodeId={doc.id} /> : null}
      </Group>
    </Group>
  )
}
