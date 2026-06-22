import {Loader} from "@mantine/core"
import {Navigate} from "react-router-dom"

import PostAuthRedirect from "@/features/auth/PostAuthRedirect"
import {hasAuthCookie} from "@/features/public/guestMode"
import {useGetPublicCatalogRootQuery} from "@/features/public/publicApiSlice"

export default function PublicBrowseRedirect() {
  if (hasAuthCookie()) {
    return <PostAuthRedirect />
  }

  return <PublicBrowseRedirectGuest />
}

function PublicBrowseRedirectGuest() {
  const {data: root, isLoading, isError} = useGetPublicCatalogRootQuery()

  if (isLoading) {
    return <Loader />
  }

  if (isError || !root) {
    return <Navigate to="/" replace />
  }

  return <Navigate to={`/browse/folder/${root.id}`} replace />
}
