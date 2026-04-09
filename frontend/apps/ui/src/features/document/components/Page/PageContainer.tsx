import {useCurrentDocVer} from "@/features/document/hooks"
import {
  getBlobViewerCategory,
  getFileExtension
} from "@/features/document/documentPreview"
import {Page} from "viewer"
import BlobMediaPage from "./BlobMediaPage"
import SelectablePdfPage from "./SelectablePdfPage"
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

  if (getFileExtension(docVer?.file_name) === ".pdf" && docVer) {
    return (
      <SelectablePdfPage
        ref={ref}
        docVerId={docVer.id}
        pageNumber={pageNumber}
        angle={angle}
        zoomFactor={zoomFactor}
        fallbackImageURL={imageURL}
        isImageLoading={isLoading}
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
