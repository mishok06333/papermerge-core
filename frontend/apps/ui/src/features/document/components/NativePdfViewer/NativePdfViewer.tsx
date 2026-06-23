import {useAppSelector} from "@/app/hooks"
import PanelContext from "@/contexts/PanelContext"
import useCurrentDocVer from "@/features/document/hooks/useCurrentDocVer"
import {selectContentHeight} from "@/features/ui/uiSlice"
import {getBaseURL} from "@/utils"
import {Loader} from "@mantine/core"
import {useContext} from "react"
import {useTranslation} from "react-i18next"

import type {PanelMode} from "@/types"

import classes from "./NativePdfViewer.module.css"

export default function NativePdfViewer() {
  const {docVer} = useCurrentDocVer()
  const mode: PanelMode = useContext(PanelContext)
  const height = useAppSelector(s => selectContentHeight(s, mode))
  const {t} = useTranslation()

  if (!docVer) {
    return (
      <div className={classes.root} style={{height: `${height}px`}}>
        <Loader />
      </div>
    )
  }

  const previewUrl = `${getBaseURL()}/api/document-versions/${docVer.id}/download?inline=1`

  return (
    <div className={classes.root} style={{height: `${height}px`}}>
      <iframe
        title={t("public.document.preview")}
        src={previewUrl}
        className={classes.frame}
      />
    </div>
  )
}
