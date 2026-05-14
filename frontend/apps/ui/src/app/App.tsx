import {AppShell} from "@mantine/core"
import "@mantine/core/styles.css"
import "@mantine/dates/styles.css"
import {useViewportSize} from "@mantine/hooks"
import {useEffect, useRef} from "react"
import {useDispatch, useSelector} from "react-redux"
import {Outlet, useLocation, useNavigate} from "react-router-dom"

import Header from "@/components/Header/Header"
import NavBar from "@/components/NavBar"
import {updateOutlet} from "@/features/ui/uiSlice"
import {
  selectCurrentUser,
  selectCurrentUserError,
  selectCurrentUserStatus
} from "@/slices/currentUser"

import Uploader from "@/components/Uploader"
import {selectNavBarWidth} from "@/features/ui/uiSlice"
import {
  NODE_VIEW,
  PORTAL_FEED_VIEW,
  PORTAL_VIEW,
  DOCUMENT_TYPE_VIEW,
  canManageDocumentTypes,
  canManageTags
} from "@/scopes"
import "./App.css"

function App() {
  const {height, width} = useViewportSize()
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useDispatch()
  const status = useSelector(selectCurrentUserStatus)
  const error = useSelector(selectCurrentUserError)
  const navBarWidth = useSelector(selectNavBarWidth)
  const user = useSelector(selectCurrentUser)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (status != "succeeded" || !user) {
      return
    }
    const scopes = user.scopes ?? []
    const defaultPath = scopes.includes(NODE_VIEW)
      ? "/library/favorites"
      : scopes.includes(PORTAL_VIEW)
        ? "/portal"
        : scopes.includes(PORTAL_FEED_VIEW)
          ? "/portal/feed"
          : canManageTags(scopes)
            ? "/tags"
            : scopes.includes(DOCUMENT_TYPE_VIEW) ||
                canManageDocumentTypes(scopes)
              ? "/document-types/"
              : "/library/favorites"

    const p = location.pathname
    if (p === "/" || p === "/home" || p === "/home/") {
      navigate(defaultPath)
    }
  }, [status, user, location.pathname, navigate])

  useEffect(() => {
    if (ref?.current) {
      let value = 0
      const styles = window.getComputedStyle(ref?.current)
      value = parseInt(styles.marginTop)
      value += parseInt(styles.paddingTop)
      dispatch(updateOutlet(value))
    }
  }, [width, height])

  if (status == "failed") {
    return <>{error}</>
  }

  return (
    <>
      <AppShell
        header={{height: 60}}
        navbar={{
          width: navBarWidth,
          breakpoint: 0
        }}
      >
        <AppShell.Header>
          <Header />
        </AppShell.Header>

        <AppShell.Navbar>
          <NavBar />
        </AppShell.Navbar>

        <AppShell.Main ref={ref}>
          <Outlet />
          <Uploader />
        </AppShell.Main>
      </AppShell>
    </>
  )
}

export default App
