import {Button, Group, Text, useMantineTheme} from "@mantine/core"
import {IconLogin} from "@tabler/icons-react"
import {useTranslation} from "react-i18next"

import {ColorSchemeToggle} from "@/components/ColorSchemeToggle/ColorSchemeToggle"
import HelpButton from "@/components/Header/HelpButton"
import SidebarToggle from "@/components/Header/SidebarToggle"
import classes from "@/components/Header/Header.module.css"
import {navigateToLogin} from "@/features/public/guestMode"

const APP_TITLE =
  import.meta.env.VITE_APP_TITLE?.trim() || "Электронная библиотека"

export default function GuestHeader() {
  const {t} = useTranslation()
  const theme = useMantineTheme()

  const onLogin = () => {
    navigateToLogin()
  }

  return (
    <header
      className="top-header"
      style={{
        backgroundColor: theme.colors.pmg[9],
        color: theme.colors.pmg[0]
      }}
    >
      <div className={classes.inner}>
        <Group>
          <SidebarToggle />
          <Text fw={600} size="sm" visibleFrom="sm">
            {APP_TITLE}
          </Text>
        </Group>
        <Group>
          <HelpButton />
          <ColorSchemeToggle />
          <Button
            size="compact-sm"
            variant="white"
            leftSection={<IconLogin size={16} />}
            onClick={onLogin}
          >
            {t("public.landing.login")}
          </Button>
        </Group>
      </div>
    </header>
  )
}
