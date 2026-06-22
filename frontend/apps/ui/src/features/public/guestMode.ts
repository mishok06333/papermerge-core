/** True when the SPA should run in guest mode (no user fetch required). */

export function isGuestRoute(pathname: string): boolean {
  if (pathname === "/" || pathname === "") {
    return true
  }
  return pathname.startsWith("/browse")
}

export function hasAuthCookie(): boolean {
  return document.cookie.split(";").some(c => c.trim().startsWith("access_token="))
}
