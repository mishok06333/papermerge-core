import {LoaderFunctionArgs} from "react-router"

import DualPanel from "@/components/DualPanel"
import {currentNodeChanged} from "@/features/ui/uiSlice"

import {store} from "@/app/store"

export default function Folder() {
  return <DualPanel />
}

export async function loader({params, request}: LoaderFunctionArgs) {
  const url = new URL(request.url)
  const folderId = params.folderId
  if (!folderId) {
    throw new Response("Missing folder id", {status: 400})
  }

  store.dispatch(
    currentNodeChanged({id: folderId, ctype: "folder", panel: "main"})
  )

  return {nodeId: folderId, urlParams: url.searchParams}
}
