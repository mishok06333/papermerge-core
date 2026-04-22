import {useAppDispatch} from "@/app/hooks"
import useAreAllPreviewsAvailable from "@/features/document/hooks/useAreAllPreviewsAvailable"
import {ensureDocVerBuffer} from "@/features/document/hooks/useEnsureDocVerBuffer"
import {generatePreviews} from "@/features/document/store/imageObjectsSlice"
import {fileManager} from "@/features/files/fileManager"
import {ClientDocumentVersion} from "@/types"
import {ImageSize} from "@/types.d/common"
import {useEffect} from "react"

interface Args {
  docVer?: ClientDocumentVersion
  pageNumber: number
  pageSize: number
  imageSize: ImageSize
}

export default function useGeneratePreviews({
  docVer,
  pageSize,
  pageNumber,
  imageSize
}: Args): boolean {
  const dispatch = useAppDispatch()
  const allPreviewsAreAvailable = useAreAllPreviewsAvailable({
    docVer,
    pageSize,
    pageNumber,
    imageSize
  })

  useEffect(() => {
    if (!docVer || allPreviewsAreAvailable) {
      return
    }
    let cancelled = false

    const run = async () => {
      if (!fileManager.getByDocVerID(docVer.id)?.buffer) {
        await ensureDocVerBuffer(docVer)
      }
      if (cancelled) {
        return
      }
      if (!fileManager.getByDocVerID(docVer.id)?.buffer) {
        // download failed; ensureDocVerBuffer already logged the reason.
        return
      }
      dispatch(
        generatePreviews({
          docVer,
          size: imageSize,
          pageSize,
          pageNumber,
          pageTotal: docVer.pages.length
        })
      )
    }

    void run()

    return () => {
      cancelled = true
    }
  }, [dispatch, docVer, pageSize, pageNumber, allPreviewsAreAvailable])

  return allPreviewsAreAvailable
}
