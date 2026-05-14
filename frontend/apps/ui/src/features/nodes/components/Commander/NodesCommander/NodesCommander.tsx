import {Box, Group, Stack} from "@mantine/core"
import {useDisclosure} from "@mantine/hooks"
import {useContext, useMemo, useState} from "react"
import {createRoot} from "react-dom/client"

import {useAppDispatch, useAppSelector} from "@/app/hooks"
import {useLocation, useNavigate} from "react-router-dom"

import {
  currentNodeChanged,
  selectCurrentNodeID,
  selectDraggedPagesDocID,
  selectDraggedPagesDocParentID,
  selectFilterText
} from "@/features/ui/uiSlice"

import {
  isFetchBaseQueryError,
  isHTTP403Forbidden,
  isHTTP404NotFound,
  isHTTP422UnprocessableContent
} from "@/services/helpers"

import {
  ERRORS_403_ACCESS_FORBIDDEN,
  ERRORS_404_RESOURCE_NOT_FOUND,
  ERRORS_422_UNPROCESSABLE_CONTENT
} from "@/cconstants"
import {isSupportedFile} from "@/features/nodes/utils"
import {useGetPortalRootQuery} from "@/features/portal/portalApiSlice"
import PortalFolderTree from "@/features/portal/components/PortalFolderTree"
import {makePortalDocumentNavState} from "@/features/portal/portalNavState"
import {
  PORTAL_DOCUMENT_DELETE,
  PORTAL_DOCUMENT_UPDATE,
  PORTAL_DOCUMENT_UPLOAD,
  PORTAL_SECTION_CREATE,
  PORTAL_SECTION_DELETE,
  PORTAL_SECTION_UPDATE,
  PORTAL_VIEW
} from "@/scopes"

import Breadcrumbs from "@/components/Breadcrumbs"
import Pagination from "@/components/Pagination"
import PanelContext from "@/contexts/PanelContext"
import {
  useGetFolderQuery,
  useGetPaginatedNodesQuery
} from "@/features/nodes/apiSlice"
import {
  commanderLastPageSizeUpdated,
  currentDocVerUpdated,
  selectCommanderSortMenuColumn,
  selectCommanderSortMenuDir,
  selectContentHeight,
  selectDraggedNodes,
  selectDraggedNodesSourceFolderID,
  selectDraggedPages,
  selectHomeFolderTreeOpen,
  selectLastPageSize
} from "@/features/ui/uiSlice"
import type {NType, PanelMode} from "@/types"
import classes from "./Commander.module.scss"

import {
  APP_THUMBNAIL_KEY,
  APP_THUMBNAIL_VALUE
} from "@/features/document/constants"
import {APP_NODE_KEY, APP_NODE_VALUE} from "@/features/nodes/constants"
import {useTranslation} from "react-i18next"
import DraggingIcon from "./DraggingIcon"
import {DropFilesModal} from "./DropFiles"
import DropNodesModal from "./DropNodesDialog"
import ExtractPagesModal from "./ExtractPagesModal"
import {selectCurrentUser} from "@/slices/currentUser"
import {equalUUIDs} from "@/utils"

import FolderNodeActions from "./FolderNodeActions"
import NodesList from "./NodesList"
import SupportedFilesInfoModal from "./SupportedFilesInfoModal"

export default function Commander() {
  const {t} = useTranslation()
  const [
    supportedFilesInfoOpened,
    {open: supportedFilesInfoOpen, close: supportedFilesInfoClose}
  ] = useDisclosure(false)
  // dialog for dropped files from local file system (i.e. from outside of browser)
  const [dropFilesOpened, {open: dropFilesOpen, close: dropFilesClose}] =
    useDisclosure(false)
  // dialog for extracting document pages (i.e. doc -> commander)
  const [
    extractPagesOpened,
    {open: extractPagesOpen, close: extractPagesClose}
  ] = useDisclosure(false)
  // confirmation dialog when dropping nodes in commander
  const [dropNodesOpened, {open: dropNodesOpen, close: dropNodesClose}] =
    useDisclosure(false)
  const [dragOver, setDragOver] = useState<boolean>(false)
  const mode: PanelMode = useContext(PanelContext)
  const height = useAppSelector(s => selectContentHeight(s, mode))
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const user = useAppSelector(selectCurrentUser)
  const onPortalFolderPath = location.pathname.startsWith("/folder/")
  const {data: portalRoot} = useGetPortalRootQuery(undefined, {
    skip:
      !onPortalFolderPath ||
      !(user?.scopes?.includes(PORTAL_VIEW) ?? false)
  })
  const lastPageSize = useAppSelector(s => selectLastPageSize(s, mode))
  const homeFolderTreeOpen = useAppSelector(selectHomeFolderTreeOpen)
  const currentNodeID = useAppSelector(s => selectCurrentNodeID(s, mode))
  const draggedPages = useAppSelector(selectDraggedPages)
  const draggedNodes = useAppSelector(selectDraggedNodes)
  const draggedNodesSourceFolderID = useAppSelector(
    selectDraggedNodesSourceFolderID
  )
  // needed to invalidate document tag
  const draggedPagesDocID = useAppSelector(selectDraggedPagesDocID)
  // needed to invalidate document's parent node tag
  const draggedPagesDocParentID = useAppSelector(selectDraggedPagesDocParentID)
  const [pageSize, setPageSize] = useState<number>(lastPageSize)
  const [page, setPage] = useState<number>(1)
  const filter = useAppSelector(s => selectFilterText(s, mode))
  const sortDir = useAppSelector(s => selectCommanderSortMenuDir(s, mode))
  const sortColumn = useAppSelector(s => selectCommanderSortMenuColumn(s, mode))

  const {data, isLoading, isFetching, isError, refetch, error} =
    useGetPaginatedNodesQuery(
      {
        nodeID: currentNodeID!,
        page_number: page,
        page_size: pageSize,
        filter: filter,
        sortDir: sortDir,
        sortColumn: sortColumn
      },
      {skip: !currentNodeID}
    )
  const {data: currentFolder} = useGetFolderQuery(currentNodeID!, {
    skip: !currentNodeID
  })
  const [uploadFiles, setUploadFiles] = useState<File[] | FileList>()

  const isUnderPortalRoot = useMemo(() => {
    if (!portalRoot || !currentFolder?.breadcrumb?.length) {
      return false
    }
    const rootId = currentFolder.breadcrumb[0][0]
    return equalUUIDs(rootId, portalRoot.id)
  }, [portalRoot, currentFolder?.breadcrumb])

  const portalDocumentNavState = useMemo(
    () => (portalRoot ? makePortalDocumentNavState(portalRoot) : null),
    [portalRoot]
  )

  const portalFolderWritesEnabled = useMemo(() => {
    if (!isUnderPortalRoot || !onPortalFolderPath) {
      return false
    }
    const scopes = user?.scopes ?? []
    return (
      [
        PORTAL_SECTION_CREATE,
        PORTAL_SECTION_UPDATE,
        PORTAL_SECTION_DELETE,
        PORTAL_DOCUMENT_UPLOAD,
        PORTAL_DOCUMENT_UPDATE,
        PORTAL_DOCUMENT_DELETE
      ] as const
    ).some(s => scopes.includes(s))
  }, [isUnderPortalRoot, onPortalFolderPath, user?.scopes])

  if (!currentNodeID) {
    return <div>{t("common.loading")}</div>
  }

  const portalFolderTreeContext =
    mode === "main" && isUnderPortalRoot && onPortalFolderPath

  const showPortalFolderTree = portalFolderTreeContext && homeFolderTreeOpen

  if (isLoading && !data) {
    return <div>{t("common.loading")}</div>
  }

  if (isError && isHTTP422UnprocessableContent(error)) {
    navigate(ERRORS_422_UNPROCESSABLE_CONTENT)
  }

  if (isError && isHTTP404NotFound(error)) {
    navigate(ERRORS_404_RESOURCE_NOT_FOUND)
  }

  if (isError && isHTTP403Forbidden(error)) {
    navigate(ERRORS_403_ACCESS_FORBIDDEN)
  }

  if (isError) {
    const detail = isFetchBaseQueryError(error)
      ? t("nodes.load_folder_error", {status: String(error.status)})
      : t("nodes.load_folder_error_generic", {message: String(error)})
    return <div>{detail}</div>
  }

  if (!data) {
    return <div>{t("nodes.error.data_null")}</div>
  }

  const onClick = (node: NType) => {
    if (mode == "secondary") {
      return dispatch(
        currentNodeChanged({id: node.id, ctype: node.ctype, panel: "secondary"})
      )
    }
    // mode == "main"
    switch (node.ctype) {
      case "folder":
        dispatch(currentDocVerUpdated({mode: mode, docVerID: undefined}))
        navigate(`/folder/${node.id}?page_size=${lastPageSize}`)
        break
      case "document":
        if (portalDocumentNavState && isUnderPortalRoot) {
          navigate(`/document/${node.id}`, {state: portalDocumentNavState})
        } else {
          navigate(`/document/${node.id}`)
        }
        break
    }
  }

  const onPageNumberChange = (page: number) => {
    setPage(page)
  }

  const onPageSizeChange = (value: string | null) => {
    if (value) {
      const pSize = parseInt(value)
      setPageSize(pSize)
      // reset current page
      setPage(1)
      // remember last page size
      dispatch(commanderLastPageSizeUpdated({pageSize: pSize, mode}))
    }
  }
  const onDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    if (portalFolderWritesEnabled) {
      setDragOver(true)
    }
  }

  const onDragEnter = () => {
    if (portalFolderWritesEnabled) {
      setDragOver(true)
    }
  }

  const onDragLeave = () => {
    setDragOver(false)
  }

  const onDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    const payloadThumbnailData = event.dataTransfer.getData(APP_THUMBNAIL_KEY)
    const payloadNodeData = event.dataTransfer.getData(APP_NODE_KEY)

    setDragOver(false)

    if (!portalFolderWritesEnabled) {
      return
    }

    if (event.dataTransfer.files.length > 0) {
      /** (1)
       * Why dataTransfer.files.length > 0 When Dragging <img> From the App?
         When you drag an <img src="..."> element (even inside your own app),
         the browser (especially Chrome and Firefox) automatically attaches the image file to
         the DataTransfer object. This happens even if:
          * The <img> was never selected by the user from the file system.
          * The image is loaded from a remote URL or a data URL.
       */
      if (payloadThumbnailData == APP_THUMBNAIL_VALUE) {
        // ignore, as this is dragging thumbnails from docviewer
        // see (1)
      } else if (payloadNodeData == APP_NODE_VALUE) {
        // ignore, as this is dragging commander's node
        // see (1)
      } else {
        // files dropped from local FS
        const files = Array.from(event.dataTransfer.files)
        const validFiles = files.filter(isSupportedFile)

        if (validFiles.length === 0) {
          supportedFilesInfoOpen()
          return
        }

        setUploadFiles(validFiles)
        dropFilesOpen()
        return
      }
    }
    if (draggedPages && draggedPages?.length > 0) {
      extractPagesOpen()

      return
    }
    if (draggedNodes && draggedNodes?.length > 0) {
      dropNodesOpen()
      return
    }
  }

  const onDropFilesModalClose = () => {
    dropFilesClose()
    setUploadFiles(undefined)
  }

  const onPagesExtracted = () => {
    extractPagesClose()
    // Fetch again (bypassing cache) nodes of current folder.
    // Current folder has now newly extracted docs.
    refetch()
  }

  const onNodeDrag = () => {}

  const onNodeDragStart = (nodeID: string, event: React.DragEvent) => {
    const image = <DraggingIcon nodeID={nodeID} />
    let ghost = document.createElement("div")
    ghost.style.transform = "translate(-10000px, -10000px)"
    ghost.style.position = "absolute"
    document.body.appendChild(ghost)
    event.dataTransfer.setDragImage(ghost, 0, -10)
    event.dataTransfer.setData(APP_NODE_KEY, APP_NODE_VALUE)

    let root = createRoot(ghost)
    root.render(image)
  }

  let commanderContent

  if (data.items.length > 0) {
    commanderContent = (
      <>
        <Group>
          <NodesList
            items={data.items}
            onClick={onClick}
            onNodeDrag={onNodeDrag}
            onNodeDragStart={onNodeDragStart}
          />
        </Group>
        <Pagination
          pagination={{
            pageNumber: page,
            pageSize: pageSize!,
            numPages: data.num_pages
          }}
          onPageNumberChange={onPageNumberChange}
          onPageSizeChange={onPageSizeChange}
          lastPageSize={lastPageSize}
        />
      </>
    )
  } else {
    commanderContent = <Group>{t("common.empty")}</Group>
  }

  return (
    <>
      <Group
        align="flex-start"
        wrap="nowrap"
        gap="md"
        className={dragOver ? classes.accept_files : classes.commander}
      >
        {showPortalFolderTree &&
          portalRoot &&
          portalDocumentNavState && (
          <PortalFolderTree
            portalRootId={portalRoot.id}
            portalRootTitle={t("portal.root_folder")}
            currentFolderId={currentNodeID}
            height={height}
            documentNavState={portalDocumentNavState}
            folderNav="commander"
            commanderPageSize={lastPageSize}
          />
        )}
        <Box
          style={{flex: 1, minWidth: 0}}
          onDragEnter={onDragEnter}
          onDragLeave={onDragLeave}
          onDragOver={onDragOver}
          onDrop={onDrop}
        >
          <FolderNodeActions
            homeFolderTreeAvailable={portalFolderTreeContext}
            portalCommanderWriteEnabled={portalFolderWritesEnabled}
          />
          <Breadcrumbs
            breadcrumb={currentFolder?.breadcrumb}
            onClick={onClick}
            isFetching={isFetching}
          />
          <Stack
            className={classes.content}
            justify={"space-between"}
            style={{height: `${height}px`}}
          >
            {commanderContent}
          </Stack>
        </Box>
      </Group>
      {currentFolder && uploadFiles && uploadFiles.length > 0 && (
        <DropFilesModal
          opened={dropFilesOpened}
          source_files={uploadFiles}
          target={currentFolder}
          onSubmit={onDropFilesModalClose}
          onCancel={onDropFilesModalClose}
        />
      )}
      {draggedPagesDocParentID &&
        draggedPagesDocID &&
        currentFolder &&
        draggedPages &&
        draggedPages.length > 0 && (
          <ExtractPagesModal
            sourcePages={draggedPages}
            sourceDocID={draggedPagesDocID}
            sourceDocParentID={draggedPagesDocParentID}
            targetFolder={currentFolder}
            opened={extractPagesOpened}
            onSubmit={onPagesExtracted}
            onCancel={extractPagesClose}
          />
        )}
      {draggedNodes &&
        currentFolder &&
        draggedNodes.length > 0 &&
        draggedNodesSourceFolderID && (
          <DropNodesModal
            sourceNodes={draggedNodes}
            targetFolder={currentFolder}
            sourceFolderID={draggedNodesSourceFolderID}
            opened={dropNodesOpened}
            onSubmit={dropNodesClose}
            onCancel={dropNodesClose}
          />
        )}
      {supportedFilesInfoOpened && (
        <SupportedFilesInfoModal
          opened={supportedFilesInfoOpened}
          onClose={supportedFilesInfoClose}
        />
      )}
    </>
  )
}
