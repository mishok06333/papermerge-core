import {ActionIcon, Tooltip} from "@mantine/core"
import {IconHelp} from "@tabler/icons-react"
import {useTranslation} from "react-i18next"
import {useNavigate} from "react-router-dom"

export default function HelpButton() {
  const {t} = useTranslation()
  const navigate = useNavigate()

  return (
    <Tooltip label={t("user_guide.tooltip")}>
      <ActionIcon
        variant="subtle"
        color="gray"
        aria-label={t("user_guide.tooltip")}
        onClick={() => navigate("/help")}
      >
        <IconHelp />
      </ActionIcon>
    </Tooltip>
  )
}
