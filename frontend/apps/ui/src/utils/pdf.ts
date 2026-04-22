import * as pdfjsLib from "pdfjs-dist"
// Same-origin worker from the installed pdfjs-dist (avoids CDN blocks and version skew vs unpkg).
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url"

// In production behind nginx/auth gateway, use a stable .js path to avoid
// strict module MIME issues with hashed .mjs asset names.
const workerSrc =
  import.meta.env.PROD && typeof window !== "undefined"
    ? `${window.location.origin}/pdf.worker.min.js`
    : pdfWorkerUrl

pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc

interface GeneratePdfBatchPreviewArgs {
  buffer: ArrayBuffer
  width: number
  pageNumbers: number[]
  concurrency?: number
}

interface GeneratePreviewArgs {
  file: File
  width: number
  pageNumber: number
}

async function renderPageToObjectUrl(
  pdfDocument: pdfjsLib.PDFDocumentProxy,
  pageNumber: number,
  width: number
): Promise<string> {
  const canvas = document.createElement("canvas")
  const context = canvas.getContext("2d")

  if (!context) {
    throw new Error("Could not get canvas 2D context")
  }

  const page = await pdfDocument.getPage(pageNumber)
  const originalViewport = page.getViewport({scale: 1.0})
  const scale = width / originalViewport.width
  const scaledViewport = page.getViewport({scale})

  canvas.width = scaledViewport.width
  canvas.height = scaledViewport.height

  await page
    .render({
      canvasContext: context,
      viewport: scaledViewport
    })
    .promise

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(blob => {
      if (blob) {
        resolve(blob)
      } else {
        reject(new Error("Failed to create blob from canvas"))
      }
    }, "image/png")
  })

  return URL.createObjectURL(blob)
}

async function generatePdfBatchPreviews({
  buffer,
  width,
  pageNumbers,
  concurrency = 2
}: GeneratePdfBatchPreviewArgs): Promise<Record<number, string>> {
  const result: Record<number, string> = {}
  const startedAt = performance.now()
  let pdfDocument: pdfjsLib.PDFDocumentProxy | undefined
  try {
    const parseStartedAt = performance.now()
    // pdf.js may transfer/consume passed ArrayBuffer in worker mode.
    // Keep fileManager buffer reusable by passing an isolated copy.
    const data = new Uint8Array(buffer.slice(0))
    const loadingTask = pdfjsLib.getDocument({data})

    // Add timeout with proper typing
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error("PDF loading timeout")), 20000)
    })

    pdfDocument = await Promise.race([
      loadingTask.promise,
      timeoutPromise
    ])
    const parseMs = performance.now() - parseStartedAt

    let cursor = 0
    const workerCount = Math.max(1, Math.min(concurrency, pageNumbers.length))
    const workers = Array.from({length: workerCount}, async () => {
      while (cursor < pageNumbers.length) {
        const ownIndex = cursor
        cursor += 1
        const pageNumber = pageNumbers[ownIndex]
        result[pageNumber] = await renderPageToObjectUrl(
          pdfDocument,
          pageNumber,
          width
        )
      }
    })
    await Promise.all(workers)
    const totalMs = performance.now() - startedAt
    console.info(
      `[preview-metric] pdf_batch_render pages=${pageNumbers.length} parse_ms=${parseMs.toFixed(2)} total_ms=${totalMs.toFixed(2)}`
    )
    return result
  } catch (error) {
    const detail =
      error instanceof Error ? `${error.name}: ${error.message}` : String(error)
    console.error(`[pdf-preview] Error generating PDF preview: ${detail}`)
    throw error
  } finally {
    if (pdfDocument) {
      await pdfDocument.destroy().catch(() => undefined)
    }
  }
}

export {generatePdfBatchPreviews}
export async function generatePreview({
  file,
  width,
  pageNumber
}: GeneratePreviewArgs): Promise<string> {
  const rendered = await generatePdfBatchPreviews({
    buffer: await file.arrayBuffer(),
    width,
    pageNumbers: [pageNumber],
    concurrency: 1
  })
  const objectURL = rendered[pageNumber]
  if (!objectURL) {
    throw new Error(`Could not render page ${pageNumber}`)
  }
  return objectURL
}
