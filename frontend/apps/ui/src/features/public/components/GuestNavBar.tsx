import {Center, Group, Loader, Text} from "@mantine/core"
import {IconBook2, IconUsersGroup} from "@tabler/icons-react"
import {useTranslation} from "react-i18next"
import {Link, useLocation} from "react-router-dom"

import {useGetPublicCatalogRootQuery} from "@/features/public/publicApiSlice"
import {useGetVersionQuery} from "@/features/version/apiSlice"
import {selectNavBarCollapsed} from "@/features/ui/uiSlice"
import {useSelector} from "react-redux"

export default function GuestNavBar() {
  const {t} = useTranslation()
  const {pathname} = useLocation()
  const collapsed = useSelector(selectNavBarCollapsed)
  const {data: root} = useGetPublicCatalogRootQuery()
  const {data: version, isLoading} = useGetVersionQuery()

  const catalogActive =
    pathname === "/" ||
    pathname === "/browse" ||
    pathname.startsWith("/browse/folder/")

  const citizenCategoriesActive =
    pathname === "/browse/citizen-categories" ||
    pathname.startsWith("/browse/citizen-categories/")

  const catalogTo = root ? `/browse/folder/${root.id}` : "/browse"

  return (
    <>
      <div className="navbar">
        <Link
          to={catalogTo}
          className={catalogActive ? "active" : undefined}
        >
        <Group wrap="nowrap" gap="xs">
          <IconBook2 />
          {!collapsed ? t("portal.home") : null}
        </Group>
        </Link>
        <Link
          to="/browse/citizen-categories"
          className={citizenCategoriesActive ? "active" : undefined}
        >
        <Group wrap="nowrap" gap="xs">
          <IconUsersGroup />
          {!collapsed ? t("citizen_categories.nav") : null}
        </Group>
        </Link>
      </div>
      <Center className="navbar-bg-color">
        <Text size="sm" c="dimmed">
          {isLoading ? (
            <Loader size="xs" />
          ) : collapsed ? (
            version?.version
          ) : (
            <>
              {t("app.version")} {version?.version}
            </>
          )}
        </Text>
      </Center>
    </>
  )
}
