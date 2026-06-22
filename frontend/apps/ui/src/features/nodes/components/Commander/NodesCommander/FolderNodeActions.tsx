import {useAppDispatch, useAppSelector} from "@/app/hooks"
import {
  homeFolderTreeToggled,
  selectHomeFolderTreeOpen,
  selectSelectedNodesCount,
  updateActionPanel
} from "@/features/ui/uiSlice"
import {Group, Switch} from "@mantine/core"
import {useViewportSize} from "@mantine/hooks"
import {useTranslation} from "react-i18next"
import {useContext, useEffect, useRef, useState} from "react"

import ToggleSecondaryPanel from "@/components/DualPanel/ToggleSecondaryPanel"
import type {PanelMode} from "@/types"

import PanelContext from "@/contexts/PanelContext"

import DuplicatePanelButton from "@/components/DualPanel/DuplicatePanelButton"
import QuickFilter from "@/components/QuickFilter"
import ViewOptionsMenu from "@/features/nodes/components/Commander/ViewOptionsMenu"
import {filterUpdated} from "@/features/ui/uiSlice"
import DeleteButton from "./DeleteButton"
import EditNodeTagsButton from "./EditNodeTagsButton"
import EditNodeTitleButton from "./EditNodeTitleButton"
import EditNodeVisibilityButton from "./EditNodeVisibilityButton"
import NewFolderButton from "./NewFolderButton"
import SortMenu from "./SortMenu"
import UploadButton from "./UploadButton"
import {NODE_UPDATE} from "@/scopes"
import {selectCurrentUser} from "@/slices/currentUser"

type FolderNodeActionsProps = {
  homeFolderTreeAvailable?: boolean
  /** When false, hide upload / new folder / delete / rename actions (portal-only writes). */
  portalCommanderWriteEnabled?: boolean
}

export default function FolderNodeActions({
  homeFolderTreeAvailable = false,
  portalCommanderWriteEnabled = true
}: FolderNodeActionsProps) {
  const {t} = useTranslation()
  const [filterText, selectFilterText] = useState<string>()
  const {height, width} = useViewportSize()
  const dispatch = useAppDispatch()
  const ref = useRef<HTMLDivElement>(null)
  const mode: PanelMode = useContext(PanelContext)
  const selectedCount = useAppSelector(s => selectSelectedNodesCount(s, mode))
  const homeFolderTreeOpen = useAppSelector(selectHomeFolderTreeOpen)
  const user = useAppSelector(selectCurrentUser)
  const canUpdateNodes = (user?.scopes ?? []).includes(NODE_UPDATE)

  const onQuickFilterClear = () => {
    selectFilterText(undefined)
    dispatch(filterUpdated({mode, filter: undefined}))
  }

  const onQuickFilterChange = (value: string) => {
    selectFilterText(value)
    dispatch(filterUpdated({mode, filter: value}))
  }

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
        {portalCommanderWriteEnabled && selectedCount == 0 && <UploadButton />}
        {portalCommanderWriteEnabled && selectedCount == 0 && <NewFolderButton />}
        {portalCommanderWriteEnabled && selectedCount == 1 && (
          <EditNodeTitleButton />
        )}
        {portalCommanderWriteEnabled && selectedCount == 1 && (
          <EditNodeTagsButton />
        )}
        {portalCommanderWriteEnabled &&
          canUpdateNodes &&
          selectedCount == 1 && <EditNodeVisibilityButton />}
        {portalCommanderWriteEnabled && selectedCount > 0 && <DeleteButton />}
      </Group>
      <Group grow preventGrowOverflow={false} wrap="nowrap">
        {homeFolderTreeAvailable && (
          <Switch
            size="xs"
            label={t("homeFolderTree.show")}
            checked={homeFolderTreeOpen}
            onChange={() => dispatch(homeFolderTreeToggled())}
          />
        )}
        <ViewOptionsMenu />
        <SortMenu />
        <QuickFilter
          onChange={onQuickFilterChange}
          onClear={onQuickFilterClear}
          filterText={filterText}
        />
        <DuplicatePanelButton />
        <ToggleSecondaryPanel />
      </Group>
    </Group>
  )
}
