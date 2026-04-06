import {useAppSelector} from "@/app/hooks"
import PanelContext from "@/contexts/PanelContext"
import BlobMediaPage from "@/features/document/components/Page/BlobMediaPage"
import useCurrentDocVer from "@/features/document/hooks/useCurrentDocVer"
import {selectContentHeight} from "@/features/ui/uiSlice"
import {Box, Loader, ScrollArea} from "@mantine/core"
import {useContext, useMemo} from "react"

import type {PanelMode} from "@/types"

import classes from "./BlobDocumentViewer.module.css"

export default function BlobDocumentViewer() {
  const {docVer} = useCurrentDocVer()
  const mode: PanelMode = useContext(PanelContext)
  const height = useAppSelector(s => selectContentHeight(s, mode))

  const firstPage = useMemo(() => {
    const pages = docVer?.pages.slice().sort((a, b) => a.number - b.number)
    return pages?.[0]
  }, [docVer?.pages])

  if (!docVer || !firstPage) {
    return (
      <div className={classes.root} style={{height: `${height}px`}}>
        <Loader />
      </div>
    )
  }

  return (
    <div className={classes.root} style={{height: `${height}px`}}>
      <ScrollArea className={classes.scroll} type="auto" scrollbarSize={8}>
        <Box p="md" pb="xl">
          <BlobMediaPage
            pageID={firstPage.id}
            pageNumber={firstPage.number}
            zoomFactor={100}
            fileName={docVer.file_name}
            layout="standalone"
          />
        </Box>
      </ScrollArea>
    </div>
  )
}
