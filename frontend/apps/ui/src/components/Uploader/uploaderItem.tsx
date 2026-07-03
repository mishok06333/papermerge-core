import {useAppSelector} from "@/app/hooks"
import PanelContext from "@/contexts/PanelContext"
import {FileItemType, PanelMode} from "@/types"
import {
  Box,
  Group,
  List,
  Loader,
  Text,
  ThemeIcon,
  Tooltip,
  rem
} from "@mantine/core"
import {IconCircleCheck, IconFolder, IconX} from "@tabler/icons-react"
import {useContext, useMemo} from "react"
import {useNavigate} from "react-router-dom"

import {useGetPortalRootQuery} from "@/features/portal/portalApiSlice"
import {makePortalDocumentNavState} from "@/features/portal/portalNavState"
import {selectLastPageSize} from "@/features/ui/uiSlice"
import {equalUUIDs, drop_extension} from "@/utils"
import classes from "./uploaderItem.module.css"

type Args = {
  fileItem: FileItemType
}

export default function UploaderItem({fileItem}: Args) {
  const mode: PanelMode = useContext(PanelContext)
  const navigate = useNavigate()
  const lastPageSize = useAppSelector(s => selectLastPageSize(s, mode))
  const {data: portalRoot} = useGetPortalRootQuery()
  let statusComponent

  const isUnderPortalRoot = useMemo(() => {
    if (!portalRoot || !fileItem.target.breadcrumb?.length) {
      return false
    }
    const rootId = fileItem.target.breadcrumb[0][0]
    return equalUUIDs(rootId, portalRoot.id)
  }, [portalRoot, fileItem.target.breadcrumb])

  const canOpenDocument =
    fileItem.status === "success" && fileItem.source?.id != null

  const onTargetClick = () => {
    navigate(`/folder/${fileItem.target.id}?page_size=${lastPageSize}`)
  }

  const onFileClick = () => {
    if (!canOpenDocument) {
      return
    }
    const documentId = fileItem.source!.id
    if (portalRoot && isUnderPortalRoot) {
      navigate(`/document/${documentId}`, {
        state: makePortalDocumentNavState(portalRoot)
      })
    } else {
      navigate(`/document/${documentId}`)
    }
  }

  if (fileItem.status == "uploading") {
    statusComponent = <Loader mt="xs" size={"sm"} />
  } else if (fileItem.status == "failure") {
    statusComponent = (
      <ThemeIcon color="red" size={24} radius="xl">
        <IconX style={{width: rem(16), height: rem(16)}} />
      </ThemeIcon>
    )
  } else {
    statusComponent = (
      <ThemeIcon color="green" size={24} radius="xl">
        <IconCircleCheck style={{width: rem(16), height: rem(16)}} />
      </ThemeIcon>
    )
  }

  if (fileItem.status == "failure") {
    return (
      <Tooltip label={fileItem.error}>
        <List.Item className={classes.uploaderItem} icon={statusComponent}>
          <Group justify="space-between">
            <Group
              justify="center"
              gap="xs"
              className={classes.uploaderItemTarget}
              onClick={onTargetClick}
            >
              <IconFolder /> {fileItem.target.title}
            </Group>
            <Box className={classes.uploaderItemFile}>{drop_extension(fileItem.file_name)}</Box>
          </Group>
        </List.Item>
      </Tooltip>
    )
  }

  return (
    <List.Item className={classes.uploaderItem} icon={statusComponent}>
      <Group justify="space-between">
        <Group className={classes.uploaderItemTarget} onClick={onTargetClick}>
          <IconFolder />
          <Text w={150} truncate="end">
            {fileItem.target.title}
          </Text>
        </Group>
        <Box
          className={
            canOpenDocument
              ? classes.uploaderItemFile
              : classes.uploaderItemFileDisabled
          }
          onClick={canOpenDocument ? onFileClick : undefined}
        >
          <Text w={150} truncate="end">
            {drop_extension(fileItem.file_name)}
          </Text>
        </Box>
        <Box>{fileItem.error}</Box>
      </Group>
    </List.Item>
  )
}
