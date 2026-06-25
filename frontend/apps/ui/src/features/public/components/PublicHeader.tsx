import {Button, Group, Title} from "@mantine/core"
import {IconLogin} from "@tabler/icons-react"
import {useTranslation} from "react-i18next"

import {navigateToLogin} from "@/features/public/guestMode"

export default function PublicHeader() {
  const {t} = useTranslation()

  const onLogin = () => {
    navigateToLogin()
  }

  return (
    <Group justify="space-between" px="md" py="sm" style={{borderBottom: "1px solid var(--mantine-color-gray-3)"}}>
      <Title order={3}>{t("public.landing.title")}</Title>
      <Button leftSection={<IconLogin size={16} />} onClick={onLogin}>
        {t("public.landing.login")}
      </Button>
    </Group>
  )
}
