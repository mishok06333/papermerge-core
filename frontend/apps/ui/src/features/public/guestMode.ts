import Cookies from "js-cookie"

const ACCESS_TOKEN_COOKIE = "access_token"

/** True when the SPA should run in guest mode (no user fetch required). */

export function isGuestRoute(pathname: string): boolean {
  if (pathname === "/" || pathname === "" || pathname === "/help") {
    return true
  }
  return pathname.startsWith("/browse")
}

export function hasAuthCookie(): boolean {
  return document.cookie
    .split(";")
    .some(c => c.trim().startsWith(`${ACCESS_TOKEN_COOKIE}=`))
}

/** Remove the JWT cookie from all paths the auth-server may have used. */
export function clearAuthCookie(): void {
  Cookies.remove(ACCESS_TOKEN_COOKIE, {path: "/"})
  Cookies.remove(ACCESS_TOKEN_COOKIE)
  document.cookie = `${ACCESS_TOKEN_COOKIE}=; Max-Age=0; path=/`
}

/**
 * True when API calls use same-origin relative URLs and nginx auth_request
 * gates protected routes (docker/production bundle).
 */
export function usesNginxAuthGate(): boolean {
  const viteBase = import.meta.env.VITE_BASE_URL as string | undefined
  return !viteBase || viteBase === window.location.origin
}

/**
 * Open the auth-server login page. Clears any stale client cookie first so
 * nginx auth_request returns 401 and serves the login SPA instead of looping
 * through PostAuthRedirect back to the guest landing.
 */
export function navigateToLogin(): void {
  if (hasAuthCookie()) {
    window.location.href = "/home"
    return
  }
  clearAuthCookie()
  window.location.href = "/home"
}

/** Routes where PostAuthRedirect owns the /api/users/me fetch after login. */
export function isPostAuthRoute(pathname: string): boolean {
  if (pathname === "/login" || pathname === "/home") {
    return true
  }
  return pathname.startsWith("/login/") || pathname.startsWith("/home/")
}
