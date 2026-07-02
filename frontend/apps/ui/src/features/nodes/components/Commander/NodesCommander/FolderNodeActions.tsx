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

import {useContext, useEffect, useMemo, useRef, useState} from "react"



import ToggleSecondaryPanel from "@/components/DualPanel/ToggleSecondaryPanel"

import type {PanelMode} from "@/types"



import PanelContext from "@/contexts/PanelContext"



import DuplicatePanelButton from "@/components/DualPanel/DuplicatePanelButton"

import QuickFilter from "@/components/QuickFilter"

import {filterUpdated} from "@/features/ui/uiSlice"

import DeleteButton from "./DeleteButton"

import EditNodeTagsButton from "./EditNodeTagsButton"

import EditNodeTitleButton from "./EditNodeTitleButton"

import EditNodeVisibilityButton from "./EditNodeVisibilityButton"

import NewFolderButton from "./NewFolderButton"

import MspTemplateButton from "./MspTemplateButton"
import EditFolderCategoriesButton from "@/features/citizen_categories/components/EditFolderCategoriesButton"

import SortMenu from "./SortMenu"

import UploadButton from "./UploadButton"

import {

  canAssignNodeTags,

  canCreateFolderInCommander,

  canDeleteInCommander,

  canOpenCommander,

  canRenameInCommander,

  canUploadInCommander,

  canUseMspTemplateInCommander,

  NODE_UPDATE,

  type CommanderWriteContext

} from "@/scopes"

import {selectCurrentUser} from "@/slices/currentUser"



type FolderNodeActionsProps = {

  homeFolderTreeAvailable?: boolean

  commanderWriteContext: CommanderWriteContext

}



export default function FolderNodeActions({

  homeFolderTreeAvailable = false,

  commanderWriteContext

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

  const scopes = user?.scopes ?? []

  const canUpdateNodes = scopes.includes(NODE_UPDATE)

  const canEditTags = canAssignNodeTags(scopes)



  const writePerms = useMemo(

    () => ({

      upload: canUploadInCommander(scopes, commanderWriteContext),

      createFolder: canCreateFolderInCommander(scopes, commanderWriteContext),

      mspTemplate: canUseMspTemplateInCommander(scopes),

      rename: canRenameInCommander(scopes, commanderWriteContext),

      delete: canDeleteInCommander(scopes, commanderWriteContext)

    }),

    [scopes, commanderWriteContext]

  )



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

        {writePerms.upload && selectedCount == 0 && <UploadButton />}

        {writePerms.createFolder && selectedCount == 0 && <NewFolderButton />}

        {writePerms.mspTemplate && selectedCount == 0 && <MspTemplateButton />}

        {writePerms.rename && selectedCount == 1 && <EditNodeTitleButton />}

        {writePerms.rename && selectedCount == 1 && canEditTags && (

          <EditNodeTagsButton />

        )}

        {writePerms.rename &&

          canUpdateNodes &&

          selectedCount == 1 && <EditNodeVisibilityButton />}

        {selectedCount == 1 && <EditFolderCategoriesButton />}

        {writePerms.delete && selectedCount > 0 && <DeleteButton />}

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

        <SortMenu />

        <QuickFilter

          onChange={onQuickFilterChange}

          onClear={onQuickFilterClear}

          filterText={filterText}

        />

        {canOpenCommander(scopes) && <DuplicatePanelButton />}

        {canOpenCommander(scopes) && <ToggleSecondaryPanel />}

      </Group>

    </Group>

  )

}

