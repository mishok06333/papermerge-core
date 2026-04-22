import {AppThunk} from "@/app/types"
import {
  DOC_VER_PAGINATION_PAGE_BATCH_SIZE,
  DOC_VER_PAGINATION_THUMBNAIL_BATCH_SIZE
} from "@/features/document/constants"
import {ImageSize} from "@/types.d/common"
import {ClientDocumentVersion} from "../types"
import {generateNextPreviews} from "./generateNextPreviews"

interface Args {
  docVer?: ClientDocumentVersion
  targetPageNumber: number
  size: ImageSize
}

export const ensurePreviewForPage =
  ({docVer, targetPageNumber, size}: Args): AppThunk<Promise<void>> =>
  async (dispatch, getState) => {
    if (!docVer) {
      return
    }

    const normalizedPageNumber = Math.max(1, Math.floor(targetPageNumber))
    const targetPage = docVer.pages.find(p => p.number === normalizedPageNumber)
    if (!targetPage) {
      return
    }

    const hasTargetPreview = () => {
      const state = getState()
      const page = state.imageObjects.pageIDEntities[targetPage.id]
      return Boolean(page?.docVerID === docVer.id && page[size])
    }

    if (hasTargetPreview()) {
      return
    }

    const pageSize =
      size === "sm"
        ? DOC_VER_PAGINATION_THUMBNAIL_BATCH_SIZE
        : DOC_VER_PAGINATION_PAGE_BATCH_SIZE
    const maxBatches = Math.ceil(docVer.pages.length / pageSize)
    let attempts = 0

    while (!hasTargetPreview() && attempts < maxBatches) {
      const state = getState()
      const currentPaginationPage =
        size === "sm"
          ? (state.docVers.entities[docVer.id]?.thumbnailsPagination?.page_number ??
            1)
          : state.docVers.entities[docVer.id]?.pagination?.page_number ?? 1
      const nextPageNumber = currentPaginationPage + 1
      const nextBatchStartIndex = (nextPageNumber - 1) * pageSize

      if (nextBatchStartIndex >= docVer.pages.length) {
        return
      }

      await dispatch(generateNextPreviews({docVer, pageNumber: nextPageNumber, size}))
      attempts += 1
    }
  }
