import {useCurrentDocVer} from "@/features/document/hooks"
import {getBlobViewerCategory} from "@/features/document/documentPreview"
import {Page} from "viewer"
import BlobMediaPage from "./BlobMediaPage"
import usePage from "./usePage"

interface Args {
  pageNumber: number
  angle: number
  zoomFactor: number
  pageID: string
}

export default function PageContainer({
  pageNumber,
  angle,
  pageID,
  zoomFactor
}: Args) {
  const {docVer} = useCurrentDocVer()
  const {ref, isLoading, imageURL} = usePage({pageNumber, pageID})
  const category = getBlobViewerCategory(docVer?.file_name)

  if (category !== "pdf-pages") {
    return (
      <BlobMediaPage
        pageID={pageID}
        pageNumber={pageNumber}
        zoomFactor={zoomFactor}
        fileName={docVer?.file_name}
      />
    )
  }

  return (
    <Page
      ref={ref}
      angle={angle}
      zoomFactor={zoomFactor}
      isLoading={isLoading}
      pageNumber={pageNumber}
      imageURL={imageURL}
    />
  )
}
