import {ActionIcon, Box, Tooltip} from "@mantine/core"
import {useDisclosure} from "@mantine/hooks"
import {IconFileText} from "@tabler/icons-react"
import {forwardRef} from "react"
import {useTranslation} from "react-i18next"

import {PageOCRDialog} from "./PageOCRDialog"

interface Args {
  hidden?: boolean
}

const ViewOCRTextButton = forwardRef<HTMLButtonElement, Args>((props, ref) => {
  const {t} = useTranslation()
  const {hidden} = props
  const [opened, {open, close}] = useDisclosure(false)

  return (
    <Box>
      <Tooltip label={t("common.view_ocr_text")} withArrow>
        <ActionIcon
          style={hidden ? {display: "none"} : {}}
          ref={ref}
          size={"lg"}
          variant="default"
          onClick={open}
        >
          <IconFileText stroke={1.4} />
        </ActionIcon>
      </Tooltip>
      <PageOCRDialog opened={opened} onClose={close} />
    </Box>
  )
})

export default ViewOCRTextButton
