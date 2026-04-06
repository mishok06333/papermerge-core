import useCurrentPageNumber from "@/features/document/hooks/useCurrentPageNumber"
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode
} from "react"

import {DOCX_VIEWER_PAGE_CLASS} from "./docxViewerConstants"

type DocxScrollContextValue = {
  scrollRef: React.RefObject<HTMLDivElement | null>
  sectionsRef: React.MutableRefObject<HTMLElement[]>
  pageCount: number
  setPageMeta: (count: number, sections: HTMLElement[]) => void
  currentPageNumber: number
}

const DocxScrollContext = createContext<DocxScrollContextValue | null>(null)

export function DocxScrollProvider({children}: {children: ReactNode}) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const sectionsRef = useRef<HTMLElement[]>([])
  const [pageCount, setPageCount] = useState(0)

  const setPageMeta = useCallback((count: number, sections: HTMLElement[]) => {
    sectionsRef.current = sections
    setPageCount(Math.max(1, count))
  }, [])

  const {currentPageNumber} = useCurrentPageNumber({
    containerRef: scrollRef,
    cssSelector: `.${DOCX_VIEWER_PAGE_CLASS}`,
    initialPageNumber: 1
  })

  useEffect(() => {
    if (pageCount > 0) {
      scrollRef.current?.dispatchEvent(new Event("scroll"))
    }
  }, [pageCount])

  const value: DocxScrollContextValue = {
    scrollRef,
    sectionsRef,
    pageCount,
    setPageMeta,
    currentPageNumber
  }

  return (
    <DocxScrollContext.Provider value={value}>
      {/* display:contents so Flex lays out thumbnails + toggle + page column as siblings */}
      <div style={{display: "contents"}}>{children}</div>
    </DocxScrollContext.Provider>
  )
}

export function useDocxViewerScroll(): DocxScrollContextValue {
  const v = useContext(DocxScrollContext)
  if (!v) {
    throw new Error("useDocxViewerScroll must be used under DocxScrollProvider")
  }
  return v
}
