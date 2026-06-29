import {useSelector} from "react-redux"

import App from "@/app/App"
import GuestApp from "@/features/public/GuestApp"
import {hasAuthCookie} from "@/features/public/guestMode"
import {selectCurrentUserStatus} from "@/slices/currentUser"

/**
 * Picks the authenticated or guest chrome for /help. A single /help path is
 * registered above GuestApp/App so React Router does not always match the
 * guest tree first.
 */
export default function HelpShellPicker() {
  const status = useSelector(selectCurrentUserStatus)
  const authenticated =
    hasAuthCookie() || status === "loading" || status === "succeeded"

  return authenticated ? <App /> : <GuestApp />
}
