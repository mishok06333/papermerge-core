import {MantineProvider} from "@mantine/core"
import {Notifications} from "@mantine/notifications"
import * as React from "react"
import * as ReactDOM from "react-dom/client"
import {Provider} from "react-redux"
import {RouterProvider} from "react-router-dom"

import {store} from "@/app/store"
import {cookieLoaded} from "@/features/auth/slice"
import "@/index.css"
import {fetchCurrentUser} from "@/slices/currentUser"
import "@mantine/notifications/styles.css"

import theme from "@/themes"
import {initializeI18n} from "./initializeI18n"
import router from "./router"
import {isGuestRoute} from "./features/public/guestMode"
import {hasAuthCookie} from "./features/public/guestMode"
import "@/features/public/publicApiSlice"

async function start_app() {
  store.dispatch(cookieLoaded())
  const guestMode =
    isGuestRoute(window.location.pathname) && !hasAuthCookie()
  if (!guestMode || hasAuthCookie()) {
    store.dispatch(fetchCurrentUser())
  }

  await initializeI18n()

  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <MantineProvider theme={theme}>
        <Provider store={store}>
          <RouterProvider router={router} />
        </Provider>
        <Notifications />
      </MantineProvider>
    </React.StrictMode>
  )
}

start_app()
