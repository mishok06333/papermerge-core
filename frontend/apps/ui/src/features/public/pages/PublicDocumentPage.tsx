import {useMemo} from "react"
import {Navigate, useParams} from "react-router-dom"
import {useTranslation} from "react-i18next"

import SimpleDocumentPreview from "@/features/document/components/SimpleDocumentPreview"
import {buildPublicTrail} from "@/features/public/buildPublicTrail"
import {hasAuthCookie} from "@/features/public/guestMode"
import {
  useGetPublicCatalogRootQuery,
  useGetPublicDocumentQuery
} from "@/features/public/publicApiSlice"
import {getBaseURL, drop_extension} from "@/utils"

export default function PublicDocumentPage() {
  if (hasAuthCookie()) {
    return <PublicDocumentPageAuthRedirect />
  }

  return <PublicDocumentPageGuest />
}

function PublicDocumentPageAuthRedirect() {
  const {documentId} = useParams()
  return <Navigate to={`/document/${documentId}`} replace />
}

function PublicDocumentPageGuest() {
  const {t} = useTranslation()
  const {documentId} = useParams()

  const {data: root} = useGetPublicCatalogRootQuery()
  const {data: doc, isLoading, isError} = useGetPublicDocumentQuery(
    documentId ?? "",
    {skip: !documentId}
  )

  const trail = useMemo(() => {
    if (!doc) {
      return []
    }
    return buildPublicTrail(
      doc.breadcrumb,
      root?.id,
      {id: doc.id, title: drop_extension(doc.title)},
      t("portal.root_folder")
    )
  }, [doc, root?.id, t])

  if (!documentId) {
    return <Navigate to="/" replace />
  }

  const previewUrl = `${getBaseURL()}/api/public/documents/${documentId}/download`
  const downloadUrl = `${previewUrl}?inline=false`

  return (
    <SimpleDocumentPreview
      trail={trail}
      title={doc?.title ? drop_extension(doc.title) : ""}
      previewUrl={previewUrl}
      downloadUrl={downloadUrl}
      fileName={doc?.file_name}
      folderHref={id => `/browse/folder/${id}`}
      isLoading={isLoading}
      isError={isError || !doc}
      errorMessage={t("public.browse.forbidden")}
    />
  )
}
