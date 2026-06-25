import type {User} from "@/types.ts"
import {Group, Menu, UnstyledButton} from "@mantine/core"
import {displayName} from "@/utils/userDisplay"
import {
  IconApi,
  IconChevronRight,
  IconLogout,
  IconUser
} from "@tabler/icons-react"
import {useSelector} from "react-redux"

import {clearAuthCookie} from "@/features/public/guestMode"
import {
  selectCurrentUser,
  selectCurrentUserError,
  selectCurrentUserStatus
} from "@/slices/currentUser.ts"
import {useTranslation} from "react-i18next"

export default function UserMenu() {
  const status = useSelector(selectCurrentUserStatus)
  const error = useSelector(selectCurrentUserError)
  const user = useSelector(selectCurrentUser) as User
  const {t} = useTranslation()

  const onSignOutClicked = () => {
    clearAuthCookie()
    window.location.href = "/"
  }
  if (status == "loading") {
    return <>{t("common.loading")}</>
  }

  if (status == "failed") {
    return <>{error}</>
  }

  return (
    <Menu withArrow>
      <Menu.Target>
        <UnstyledButton>
          <Group>
            <IconUser />
            {displayName(user)}
            <IconChevronRight size="1rem" />{" "}
          </Group>
        </UnstyledButton>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Item>
          <Group>
            <IconApi />
            <a href="/docs">{t("extra.rest_api")}</a>
          </Group>
        </Menu.Item>
        <Menu.Divider />
        <Menu.Item>
          <Group>
            <IconLogout />
            <a onClick={onSignOutClicked}>{t("extra.logout")}</a>
          </Group>
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  )
}
