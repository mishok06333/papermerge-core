import {AppDispatch, RootState} from "@/app/types"
import {
  DOC_VER_PAGINATION_PAGE_BATCH_SIZE,
  DOC_VER_PAGINATION_THUMBNAIL_BATCH_SIZE
} from "@/features/document/constants"
import {
  docVerPaginationUpdated,
  docVerThumbnailsPaginationUpdated
} from "@/features/document/store/documentVersSlice"
import {
  generatePreviews,
  markGeneratingPreviewsBegin,
  markGeneratingPreviewsEnd,
  selectIsGeneratingPreviews
} from "@/features/document/store/imageObjectsSlice"

import {ClientDocumentVersion} from "@/types"
import {ImageSize} from "@/types.d/common"

interface Args {
  docVer?: ClientDocumentVersion
  pageNumber: number
  size?: ImageSize
  thumbnailListPageCount?: number
}

export const generateNextPreviews =
  ({docVer, pageNumber, size = "md", thumbnailListPageCount}: Args) =>
  async (dispatch: AppDispatch, getState: () => RootState) => {
    if (!docVer) {
      return
    }
    const stateBefore = getState()
    if (selectIsGeneratingPreviews(stateBefore, size, docVer.id)) {
      return
    }

    dispatch(markGeneratingPreviewsBegin({docVerID: docVer.id, size}))

    const pageSize =
      size == "sm"
        ? DOC_VER_PAGINATION_THUMBNAIL_BATCH_SIZE
        : DOC_VER_PAGINATION_PAGE_BATCH_SIZE

    await dispatch(
      generatePreviews({
        docVer,
        size,
        pageSize: pageSize,
        pageNumber,
        thumbnailListPageCount,
        pageTotal: docVer.pages.length
      })
    )

    dispatch(markGeneratingPreviewsEnd({docVerID: docVer.id, size}))

    if (size == "sm") {
      dispatch(
        docVerThumbnailsPaginationUpdated({
          pageNumber: pageNumber,
          pageSize: pageSize,
          docVerID: docVer.id
        })
      )
    } else {
      dispatch(
        docVerPaginationUpdated({
          pageNumber: pageNumber,
          pageSize: pageSize,
          docVerID: docVer.id
        })
      )
    }
  }
