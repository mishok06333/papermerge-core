import {LoaderFunctionArgs} from "react-router"
import {useMemo} from "react"
import {Navigate, useParams} from "react-router-dom"
import {useTranslation} from "react-i18next"

import SimpleDocumentPreview from "@/features/document/components/SimpleDocumentPreview"
import {
  useGetDocLastVersionQuery,
  useGetDocumentQuery
} from "@/features/document/store/apiSlice"
import {buildPublicTrail} from "@/features/public/buildPublicTrail"
import {useGetPortalRootQuery} from "@/features/portal/portalApiSlice"
import {getBaseURL} from "@/utils"

export default function Document() {
  const {t} = useTranslation()
  const {documentId} = useParams<{documentId: string}>()

  const {data: root} = useGetPortalRootQuery()
  const {data: doc, isLoading: docLoading, isError: docError} =
    useGetDocumentQuery(documentId ?? "", {skip: !documentId})
  const {data: lastVer, isLoading: verLoading, isError: verError} =
    useGetDocLastVersionQuery(documentId ?? "", {skip: !documentId})

  const trail = useMemo(() => {
    if (!doc) {
      return []
    }
    return buildPublicTrail(
      doc.breadcrumb,
      root?.id,
      {id: doc.id, title: doc.title},
      t("portal.root_folder")
    )
  }, [doc, root?.id, t])

  if (!documentId) {
    return <Navigate to="/portal" replace />
  }

  const previewUrl = lastVer
    ? `${getBaseURL()}/api/document-versions/${lastVer.id}/download?inline=1`
    : null
  const downloadUrl = lastVer
    ? `${getBaseURL()}/api/document-versions/${lastVer.id}/download`
    : null

  return (
    <SimpleDocumentPreview
      trail={trail}
      title={doc?.title ?? ""}
      previewUrl={previewUrl}
      downloadUrl={downloadUrl}
      folderHref={id => `/portal/folder/${id}`}
      isLoading={docLoading || verLoading}
      isError={docError || verError || !doc || !lastVer}
      errorMessage={t("public.browse.forbidden")}
    />
  )
}

export async function loader({params, request}: LoaderFunctionArgs) {
  const url = new URL(request.url)
  return {documentId: params.documentId, urlParams: url.searchParams}
}
