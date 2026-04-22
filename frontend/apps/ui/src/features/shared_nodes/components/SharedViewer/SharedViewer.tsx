import {useAppDispatch, useAppSelector} from "@/app/hooks"

import {Alert, Button, Flex, Group, Loader} from "@mantine/core"
import {useContext, useRef} from "react"
import {useNavigate} from "react-router-dom"

import {
  currentDocVerUpdated,
  currentSharedNodeRootChanged,
  selectContentHeight,
  selectCurrentSharedNodeID,
  selectLastPageSize,
  selectThumbnailsPanelOpen
} from "@/features/ui/uiSlice"

import SharedBreadcrumbs from "@/components/SharedBreadcrumb"
import PanelContext from "@/contexts/PanelContext"

import {store} from "@/app/store"
import {SHARED_FOLDER_ROOT_ID} from "@/cconstants"
import DocumentDetails from "@/components/document/DocumentDetails/DocumentDetails"
import DocumentDetailsToggle from "@/components/document/DocumentDetailsToggle"
import ThumbnailsToggle from "@/components/document/ThumbnailsToggle"
import classes from "@/components/document/Viewer.module.css"
import BlobDocumentViewer from "@/features/document/components/BlobDocumentViewer/BlobDocumentViewer"
import DocxPageColumn from "@/features/document/components/DocxViewer/DocxPageColumn"
import {DocxScrollProvider} from "@/features/document/components/DocxViewer/DocxScrollContext"
import {DOC_VER_PAGINATION_PAGE_BATCH_SIZE} from "@/features/document/constants"
import {getViewerChromeKind} from "@/features/document/documentPreview"
import useEnsureDocVerBuffer from "@/features/document/hooks/useEnsureDocVerBuffer"
import useGeneratePreviews from "@/features/document/hooks/useGeneratePreviews"
import PageList from "./PageList"
import ThumbnailList from "./ThumbnailList"

import {RootState} from "@/app/types"
import {
  useCurrentSharedDoc,
  useCurrentSharedDocVer
} from "@/features/shared_nodes/hooks"
import type {NType, PanelMode} from "@/types"
import ActionButtons from "./ActionButtons"

export default function SharedViewer() {
  const {doc} = useCurrentSharedDoc()
  const {docVer} = useCurrentSharedDocVer()

  const ref = useRef<HTMLDivElement>(null)
  const mode: PanelMode = useContext(PanelContext)
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const height = useAppSelector(s => selectContentHeight(s, mode))
  /* Ensure the PDF buffer is always present in fileManager so shared-viewer
   * pages can render a text layer; preview generation may short-circuit when
   * raster previews are already cached. */
  useEnsureDocVerBuffer(docVer)
  /* generate first batch of previews: for pages and for their thumbnails */
  const previewState = useGeneratePreviews({
    docVer: docVer,
    pageNumber: 1,
    pageSize: DOC_VER_PAGINATION_PAGE_BATCH_SIZE,
    imageSize: "md"
  })

  const lastPageSize = useAppSelector(s => selectLastPageSize(s, mode))
  const currentNodeID = useAppSelector(selectCurrentSharedNodeID)
  const thumbnailsIsOpen = useAppSelector(s =>
    selectThumbnailsPanelOpen(s, mode)
  )
  const chrome = getViewerChromeKind(docVer?.file_name)

  const onClick = (node: NType) => {
    if (node.ctype == "folder") {
      if (node.id == SHARED_FOLDER_ROOT_ID) {
        dispatch(currentSharedNodeRootChanged(undefined))
        navigate(`/shared`)
        return
      }
    }

    if (mode == "main" && node.ctype == "folder") {
      const state = store.getState() as RootState
      const sharedNode = state.sharedNodes.entities[node.id]
      if (sharedNode.is_shared_root) {
        dispatch(currentSharedNodeRootChanged(node.id))
      }
      dispatch(currentDocVerUpdated({mode: mode, docVerID: undefined}))
      navigate(`/shared/folder/${node.id}?page_size=${lastPageSize}`)
    }
  }
  /*
  useEffect(() => {
    if (doc) {
      const maxVerNum = Math.max(...doc.versions.map(v => v.number))
      const docVer = doc.versions.find(v => v.number == maxVerNum)
      if (docVer) {
        dispatch(currentDocVerUpdated({mode: mode, docVerID: docVer.id}))
      }
    }
  }, [isSuccess, doc])
  console.log(`shared viewer ${doc}`)
  */
  if (!doc) {
    return <Loader />
  }

  if (!docVer) {
    return <Loader />
  }

  return (
    <div>
      <ActionButtons />
      <Group justify="space-between">
        <SharedBreadcrumbs breadcrumb={doc?.breadcrumb} onClick={onClick} />
        <DocumentDetailsToggle />
      </Group>
      <Flex ref={ref} className={classes.inner} style={{height: `${height}px`}}>
        {chrome === "pdf" && thumbnailsIsOpen && <ThumbnailList />}
        {chrome === "pdf" && <ThumbnailsToggle />}
        {chrome === "pdf" && <PageList />}
        {chrome === "docx" && (
          <DocxScrollProvider>
            <DocxPageColumn />
          </DocxScrollProvider>
        )}
        {chrome === "blob" && <BlobDocumentViewer />}
        <DocumentDetails
          doc={doc}
          docVer={docVer}
          docID={currentNodeID}
          isLoading={false}
        />
      </Flex>
      {previewState.error && (
        <Alert color="red" title="Preview loading failed" mt="sm" variant="light">
          {previewState.error}
          <Group mt="xs">
            <Button size="xs" variant="light" onClick={previewState.retry}>
              Retry preview loading
            </Button>
          </Group>
        </Alert>
      )}
      {previewState.isBootstrapping && !previewState.allPreviewsAreAvailable && (
        <Group mt="xs">
          <Loader size="sm" />
        </Group>
      )}
    </div>
  )
}
