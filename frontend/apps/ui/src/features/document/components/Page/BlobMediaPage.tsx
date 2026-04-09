import {useAppSelector} from "@/app/hooks"
import {
  getBlobViewerCategory,
  type BlobViewerCategory
} from "@/features/document/documentPreview"
import {selectBestImageByPageId} from "@/features/document/store/selectors"
import {Box, Loader, Stack, Text} from "@mantine/core"
import {useEffect, useState, type ReactNode} from "react"
import {useTranslation} from "react-i18next"

import classes from "./BlobMediaPage.module.css"
import {TextStandalonePreview} from "./TextStandalonePreview"

export type BlobMediaPageLayout = "pageList" | "standalone"

interface Props {
  pageID: string
  pageNumber: number
  zoomFactor: number
  fileName: string | undefined
  /** pageList: inside PDF-style canvas (gray background, zoom). standalone: full preview pane. */
  layout?: BlobMediaPageLayout
}

function PageChrome({
  layout,
  pageNumber,
  children
}: {
  layout: BlobMediaPageLayout
  pageNumber: number
  children: ReactNode
}) {
  const stackClass = layout === "standalone" ? undefined : "page"
  return (
    <Stack className={stackClass} gap="xs">
      {children}
      {layout === "pageList" && <Text size="sm">{pageNumber}</Text>}
    </Stack>
  )
}

export default function BlobMediaPage({
  pageID,
  pageNumber,
  zoomFactor,
  fileName,
  layout = "pageList"
}: Props) {
  const {t} = useTranslation()
  const objectURL = useAppSelector(s => selectBestImageByPageId(s, pageID))
  const category = getBlobViewerCategory(fileName)
  const [textContent, setTextContent] = useState<string | null>(null)
  const [htmlContent, setHtmlContent] = useState<string | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  useEffect(() => {
    setTextContent(null)
    setHtmlContent(null)
    setLoadError(null)
    if (!objectURL || category === "pdf-pages") {
      return
    }

    if (category === "text" || category === "html") {
      setPending(true)
      fetch(objectURL)
        .then(r => {
          if (!r.ok) {
            throw new Error(String(r.status))
          }
          return r.text()
        })
        .then(body => {
          if (category === "html") {
            setHtmlContent(body)
          } else {
            setTextContent(body)
          }
          setPending(false)
        })
        .catch(() => {
          setLoadError(t("blobPreview.loadError"))
          setPending(false)
        })
    }
  }, [objectURL, category, t])

  if (!objectURL) {
    return (
      <PageChrome layout={layout} pageNumber={pageNumber}>
        <Loader />
      </PageChrome>
    )
  }

  if (category === "word-doc") {
    return (
      <PageChrome layout={layout} pageNumber={pageNumber}>
        <Stack gap="sm">
          <Text>{t("blobPreview.legacyDoc")}</Text>
          <Text size="sm" c="dimmed">
            {t("blobPreview.downloadHint")}
          </Text>
        </Stack>
      </PageChrome>
    )
  }

  if (pending && (category === "text" || category === "html")) {
    return (
      <PageChrome layout={layout} pageNumber={pageNumber}>
        <Loader />
      </PageChrome>
    )
  }

  if (loadError) {
    return (
      <PageChrome layout={layout} pageNumber={pageNumber}>
        <Text c="red">{loadError}</Text>
      </PageChrome>
    )
  }

  return (
    <PageChrome layout={layout} pageNumber={pageNumber}>
      <BlobInner
        category={category}
        objectURL={objectURL}
        zoomFactor={zoomFactor}
        textContent={textContent}
        htmlContent={htmlContent}
        fileName={fileName}
        layout={layout}
      />
    </PageChrome>
  )
}

function BlobInner({
  category,
  objectURL,
  zoomFactor,
  textContent,
  htmlContent,
  fileName,
  layout
}: {
  category: BlobViewerCategory
  objectURL: string
  zoomFactor: number
  textContent: string | null
  htmlContent: string | null
  fileName: string | undefined
  layout: BlobMediaPageLayout
}) {
  const {t} = useTranslation()
  const embedScroll = layout === "pageList"
  const widthStyle = {width: `${zoomFactor}%`, maxWidth: "100%"}

  if (category === "video") {
    const video =
      layout === "standalone" ? (
        <video controls src={objectURL} className={classes.videoStandalone}>
          {t("blobPreview.videoUnsupported")}
        </video>
      ) : (
        <video controls src={objectURL} style={widthStyle}>
          {t("blobPreview.videoUnsupported")}
        </video>
      )
    return (
      <Box className={layout === "standalone" ? classes.mediaWrap : undefined}>
        {video}
      </Box>
    )
  }

  if (category === "audio") {
    return (
      <Box className={layout === "standalone" ? classes.mediaWrap : undefined}>
        <audio
          controls
          src={objectURL}
          className={
            layout === "standalone" ? classes.audioStandalone : undefined
          }
          style={layout === "pageList" ? {width: "100%"} : undefined}
        >
          {t("blobPreview.audioUnsupported")}
        </audio>
      </Box>
    )
  }

  if (category === "image") {
    return <img alt="" src={objectURL} style={widthStyle} />
  }

  if (category === "text" && textContent !== null) {
    return (
      <TextStandalonePreview mode={embedScroll ? "embed" : "pane"}>
        {textContent}
      </TextStandalonePreview>
    )
  }

  if (category === "html" && htmlContent !== null) {
    return (
      <iframe
        title={fileName || "html"}
        srcDoc={htmlContent}
        sandbox=""
        className={layout === "standalone" ? classes.htmlIframe : undefined}
        style={
          embedScroll
            ? {...widthStyle, minHeight: 480, border: "1px solid #ccc"}
            : undefined
        }
      />
    )
  }

  return (
    <Stack gap="sm">
      <Text>{t("blobPreview.unsupported", {name: fileName || "file"})}</Text>
      <Text size="sm" c="dimmed">
        {t("blobPreview.downloadHint")}
      </Text>
    </Stack>
  )
}
