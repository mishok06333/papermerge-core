import {Loader, Center} from "@mantine/core"
import {useEffect} from "react"
import {useDispatch, useSelector} from "react-redux"
import {Navigate} from "react-router-dom"

import {
  fetchCurrentUser,
  selectCurrentUser,
  selectCurrentUserStatus
} from "@/slices/currentUser"
import {resolveDefaultPath} from "@/utils/defaultPath"

/**
 * Used after auth-server login (/home). Waits for /api/users/me, then routes
 * to the role-appropriate landing page.
 */
export default function PostAuthRedirect() {
  const dispatch = useDispatch()
  const status = useSelector(selectCurrentUserStatus)
  const user = useSelector(selectCurrentUser)

  useEffect(() => {
    if (status === "idle") {
      dispatch(fetchCurrentUser())
    }
  }, [dispatch, status])

  if (status === "idle" || status === "loading") {
    return (
      <Center mih="50vh">
        <Loader />
      </Center>
    )
  }

  if (status === "failed" || !user) {
    return <Navigate to="/" replace />
  }

  return <Navigate to={resolveDefaultPath(user.scopes ?? [])} replace />
}
