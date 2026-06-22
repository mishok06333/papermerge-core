import {Center, Group, Loader, Text} from "@mantine/core"
import {IconBook2} from "@tabler/icons-react"
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

  const catalogTo = root ? `/browse/folder/${root.id}` : "/browse"

  return (
    <>
      <div className="navbar">
        <Link
          to={catalogTo}
          className={catalogActive ? "active" : undefined}
        >
          <Group>
            <IconBook2 />
            {!collapsed ? t("portal.home") : null}
          </Group>
        </Link>
      </div>
      <Center className="navbar-bg-color">
        <Text size="sm" c="dimmed">
          {isLoading ? <Loader size="xs" /> : version?.version}
        </Text>
      </Center>
    </>
  )
}
