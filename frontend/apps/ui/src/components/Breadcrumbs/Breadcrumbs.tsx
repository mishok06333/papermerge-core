import {useAppDispatch, useAppSelector} from "@/app/hooks"
import {
  Anchor,
  Breadcrumbs,
  Group,
  Loader,
  Skeleton
} from "@mantine/core"
import {useViewportSize} from "@mantine/hooks"
import {IconBook2, IconFolder} from "@tabler/icons-react"
import {useContext, useEffect, useRef} from "react"
import classes from "./Breadcrumbs.module.css"

import {updateBreadcrumb} from "@/features/ui/uiSlice"

import type {NType, PanelMode, UserDetails} from "@/types"

import PanelContext from "@/contexts/PanelContext"
import {selectCurrentUser} from "@/slices/currentUser"
import {useGetPortalRootQuery} from "@/features/portal/portalApiSlice"
import {isPortalDocumentNavState} from "@/features/portal/portalNavState"
import {PORTAL_VIEW} from "@/scopes"
import {equalUUIDs} from "@/utils"
import {useTranslation} from "react-i18next"
import {useLocation} from "react-router-dom"

type Args = {
  onClick: (node: NType) => void
  className?: string
  breadcrumb?: Array<[string, string]>
  isFetching?: boolean
}

export default function BreadcrumbsComponent({
  onClick,
  className,
  breadcrumb,
  isFetching
}: Args) {
  const dispatch = useAppDispatch()
  const {height, width} = useViewportSize()
  const ref = useRef<HTMLDivElement>(null)
  const mode: PanelMode = useContext(PanelContext)

  const onRootElementClick = (n: NType) => {
    onClick(n)
  }

  useEffect(() => {
    if (ref?.current) {
      let value = 0
      const styles = window.getComputedStyle(ref?.current)
      value = parseInt(styles.marginTop)
      value += parseInt(styles.marginBottom)
      value += parseInt(styles.paddingBottom)
      value += parseInt(styles.paddingTop)
      value += parseInt(styles.height)
      dispatch(updateBreadcrumb({mode, value}))
    }
  }, [width, height])

  if (!breadcrumb) {
    return (
      <Skeleton ref={ref} width={"25%"} my="md">
        <Breadcrumbs>{["one", "two"]}</Breadcrumbs>
      </Skeleton>
    )
  }
  const items = breadcrumb
  const links = items.slice(1, -1).map(i => (
    <Anchor key={i[0]} onClick={() => onClick({id: i[0], ctype: "folder"})}>
      {i[1]}
    </Anchor>
  ))
  const lastOne = items[items.length - 1][1]

  if (items.length == 1) {
    return (
      <Group ref={ref} my={0} className={className} style={{minWidth: 0}}>
        <Breadcrumbs className={classes.breadcrumbs}>
          <RootItem
            itemId={items[0][0]}
            rootTitle={items[0][1]}
            onClick={onRootElementClick}
          />
        </Breadcrumbs>
        {isFetching && <Loader size={"sm"} />}
      </Group>
    )
  }

  return (
    <Group ref={ref} my={0} className={className} style={{minWidth: 0}}>
      <Breadcrumbs className={classes.breadcrumbs}>
        <RootItem
          itemId={items[0][0]}
          rootTitle={items[0][1]}
          onClick={onRootElementClick}
        />
        {links}
        <Anchor title={lastOne}>{lastOne}</Anchor>
      </Breadcrumbs>
      {isFetching && <Loader size={"sm"} />}
    </Group>
  )
}

type RootItemArgs = {
  itemId: string
  rootTitle: string
  onClick: (n: NType) => void
}

function RootItem({itemId, rootTitle, onClick}: RootItemArgs) {
  const {t} = useTranslation()
  const location = useLocation()
  const user = useAppSelector(selectCurrentUser) as UserDetails | undefined

  const portalNav = isPortalDocumentNavState(location.state)
    ? location.state
    : null
  const scopes = user?.scopes ?? []
  const {data: portalRoot} = useGetPortalRootQuery(undefined, {
    skip: !scopes.includes(PORTAL_VIEW)
  })

  const portalRootLabel = t("portal.root_folder")
  if (portalNav && equalUUIDs(itemId, portalNav.portalRootId)) {
    return (
      <Anchor
        onClick={() =>
          onClick({id: portalNav.portalRootId, ctype: "folder"})
        }
      >
        <Group>
          <IconBook2 />
          {portalRootLabel}
        </Group>
      </Anchor>
    )
  }
  if (portalRoot && equalUUIDs(itemId, portalRoot.id)) {
    return (
      <Anchor
        onClick={() => onClick({id: portalRoot.id, ctype: "folder"})}
      >
        <Group>
          <IconBook2 />
          {portalRootLabel}
        </Group>
      </Anchor>
    )
  }

  if (!user) {
    return <Skeleton>{rootTitle}</Skeleton>
  }

  return (
    <Anchor onClick={() => onClick({id: itemId, ctype: "folder"})}>
      <Group>
        <IconFolder />
        {rootTitle}
      </Group>
    </Anchor>
  )
}
