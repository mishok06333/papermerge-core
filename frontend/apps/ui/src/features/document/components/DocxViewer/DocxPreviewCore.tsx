import {Box, Loader, ScrollArea, Text} from "@mantine/core"
import {renderAsync} from "docx-preview"
import {useEffect, useRef, useState} from "react"
import {useTranslation} from "react-i18next"

import {DOCX_VIEWER_PAGE_CLASS} from "./docxViewerConstants"

interface Props {
  objectURL: string
  /** When true, own ScrollArea (legacy page stack). When false, outer container scrolls. */
  embedScroll: boolean
  /** docx-preview root class (sections are `section.{previewClassName}`). */
  previewClassName: string
  wrapClassName?: string
  onPagesReady?: (count: number, sections: HTMLElement[]) => void
}

export default function DocxPreviewCore({
  objectURL,
  embedScroll,
  previewClassName,
  wrapClassName,
  onPagesReady
}: Props) {
  const {t} = useTranslation()
  const containerRef = useRef<HTMLDivElement>(null)
  const onReadyRef = useRef(onPagesReady)
  onReadyRef.current = onPagesReady
  const [pending, setPending] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) {
      return
    }
    let cancelled = false
    setPending(true)
    setError(null)

    const run = async () => {
      try {
        const r = await fetch(objectURL)
        if (!r.ok) {
          throw new Error(String(r.status))
        }
        const buf = await r.arrayBuffer()
        if (cancelled) {
          return
        }
        el.innerHTML = ""
        await renderAsync(buf, el, undefined, {
          className: previewClassName,
          inWrapper: true,
          breakPages: true,
          ignoreFonts: false
        })
        if (cancelled) {
          return
        }
        const wrapper =
          el.querySelector<HTMLElement>(`.${previewClassName}-wrapper`) ?? el

        const directSections = Array.from(wrapper.children).filter(
          (n): n is HTMLElement =>
            n.tagName === "SECTION" && n.classList.contains(previewClassName)
        )

        let pageRoots: HTMLElement[] =
          directSections.length > 0
            ? directSections
            : Array.from(
                wrapper.querySelectorAll<HTMLElement>(
                  `section.${previewClassName}`
                )
              )

        if (pageRoots.length === 0) {
          pageRoots = Array.from(wrapper.children).filter(
            (n): n is HTMLElement => n.tagName === "SECTION"
          )
        }

        if (pageRoots.length === 0) {
          pageRoots = Array.from(wrapper.querySelectorAll("section"))
        }

        if (pageRoots.length === 0) {
          pageRoots = [wrapper]
        }

        pageRoots.forEach(node => node.classList.add(DOCX_VIEWER_PAGE_CLASS))
        const count = Math.max(1, pageRoots.length)
        onReadyRef.current?.(count, pageRoots)
        setPending(false)
      } catch {
        if (!cancelled) {
          onReadyRef.current?.(1, [])
          setError(t("blobPreview.docxError"))
          setPending(false)
        }
      }
    }

    void run()
    return () => {
      cancelled = true
      el.innerHTML = ""
    }
  }, [objectURL, previewClassName, t])

  if (error) {
    return <Text c="red">{error}</Text>
  }

  const inner = (
    <Box
      className={wrapClassName}
      style={{
        width: "100%",
        maxWidth: "100%",
        margin: "0 auto",
        boxSizing: "border-box"
      }}
    >
      {pending && <Loader />}
      <div ref={containerRef} />
    </Box>
  )

  if (embedScroll) {
    return (
      <ScrollArea style={{maxHeight: "80vh", width: "100%"}} type="auto">
        {inner}
      </ScrollArea>
    )
  }

  return inner
}
