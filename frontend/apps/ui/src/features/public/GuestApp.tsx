import {AppShell} from "@mantine/core"
import {useViewportSize} from "@mantine/hooks"
import {useEffect, useRef} from "react"
import {useDispatch, useSelector} from "react-redux"
import {Outlet} from "react-router-dom"

import GuestHeader from "@/features/public/components/GuestHeader"
import GuestNavBar from "@/features/public/components/GuestNavBar"
import {updateOutlet} from "@/features/ui/uiSlice"
import {selectNavBarWidth} from "@/features/ui/uiSlice"
import "@/app/App.css"

export default function GuestApp() {
  const {height, width} = useViewportSize()
  const dispatch = useDispatch()
  const navBarWidth = useSelector(selectNavBarWidth)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (ref?.current) {
      let value = 0
      const styles = window.getComputedStyle(ref.current)
      value = parseInt(styles.marginTop)
      value += parseInt(styles.paddingTop)
      dispatch(updateOutlet(value))
    }
  }, [width, height, dispatch])

  return (
    <AppShell
      header={{height: 60}}
      navbar={{
        width: navBarWidth,
        breakpoint: 0
      }}
    >
      <AppShell.Header>
        <GuestHeader />
      </AppShell.Header>

      <AppShell.Navbar>
        <GuestNavBar />
      </AppShell.Navbar>

      <AppShell.Main ref={ref}>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  )
}
