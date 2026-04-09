import {useAppSelector} from "@/app/hooks"
import useCurrentDocVer from "@/features/document/hooks/useCurrentDocVer"
import {selectBestImageByPageId} from "@/features/document/store/selectors"
import {Loader, Stack} from "@mantine/core"
import {PageList} from "viewer"
import {useMemo} from "react"

import blobPageClasses from "../Page/BlobMediaPage.module.css"
import DocxPreviewCore from "./DocxPreviewCore"
import {useDocxViewerScroll} from "./DocxScrollContext"
import {DOCX_VIEWER_CLASS} from "./docxViewerConstants"

export default function DocxPageColumn() {
  const {docVer} = useCurrentDocVer()
  const {scrollRef, setPageMeta, pageCount} = useDocxViewerScroll()

  const firstPage = useMemo(() => {
    const pages = docVer?.pages.slice().sort((a, b) => a.number - b.number)
    return pages?.[0]
  }, [docVer?.pages])

  const objectURL = useAppSelector(s =>
    firstPage ? selectBestImageByPageId(s, firstPage.id) : undefined
  )

  if (!docVer || !firstPage || !objectURL) {
    return <Loader />
  }

  const pageBody = (
    <Stack
      className="page"
      justify="flex-start"
      align="stretch"
      gap="md"
      w="100%"
    >
      <DocxPreviewCore
        objectURL={objectURL}
        embedScroll={false}
        previewClassName={DOCX_VIEWER_CLASS}
        wrapClassName={blobPageClasses.docxWrap}
        onPagesReady={setPageMeta}
      />
    </Stack>
  )

  return (
    <PageList
      ref={scrollRef}
      pageItems={[pageBody]}
      paginationInProgress={pageCount === 0}
    />
  )
}
