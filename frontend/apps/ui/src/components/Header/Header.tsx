import {Group, Text, useMantineTheme} from "@mantine/core"
import logoURL from "/logo_transparent_bg.svg"

import {ColorSchemeToggle} from "@/components/ColorSchemeToggle/ColorSchemeToggle"
import classes from "./Header.module.css"

import Search from "./Search"
import SidebarToggle from "./SidebarToggle"
import UserMenu from "./UserMenu"
import LanguageMenu from "./LanguageMenu"

const APP_TITLE =
  import.meta.env.VITE_APP_TITLE?.trim() || "Социальная поддержка 27"

function Header() {
  const theme = useMantineTheme()

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
          <img src={logoURL} width={"30px"} alt="" />
          <Text fw={600} size="sm" visibleFrom="sm">
            {APP_TITLE}
          </Text>
        </Group>
        <Group grow className={classes.search}>
          <Search />
        </Group>
        <Group>
          <LanguageMenu />
          <ColorSchemeToggle />
          <UserMenu />
        </Group>
      </div>
    </header>
  )
}

export default Header
