import {createBrowserRouter, Navigate} from "react-router-dom"

import App from "@/app/App.tsx"
import Folder, {loader as folderLoader} from "@/pages/Folder"

import PortalFeedPage from "@/features/portal/pages/PortalFeedPage"
import PortalFolderPage from "@/features/portal/pages/PortalFolderPage"
import PortalHomeRedirect from "@/features/portal/pages/PortalHomeRedirect"
import {RoleDetails, RolesList} from "@/features/roles/pages"
import {TagDetails, TagsList} from "@/features/tags/pages"
import {UserDetails, UsersList} from "@/features/users/pages"
import Document from "@/pages/Document"
import LibraryPage from "@/features/library/pages/LibraryPage"
import SearchPage from "@/pages/Search"
import AuditLogPage from "@/features/audit/pages/AuditLogPage"
import ProfilePage from "@/features/profile/pages/ProfilePage"
import HelpShellPicker from "@/features/help/pages/HelpShellPicker"
import UserGuidePage from "@/features/help/pages/UserGuidePage"

import {AccessForbidden, NotFound, UnprocessableContent} from "@/pages/errors"

import {loader as documentLoader} from "@/pages/Document"

import ErrorPage from "@/pages/Error.tsx"
import GuestApp from "@/features/public/GuestApp"
import PublicCatalogPage from "@/features/public/pages/PublicCatalogPage"
import PublicDocumentPage from "@/features/public/pages/PublicDocumentPage"
import PublicBrowseRedirect from "@/features/public/pages/PublicBrowseRedirect"
import PostAuthRedirect from "@/features/auth/PostAuthRedirect"
import {
  ERRORS_403_ACCESS_FORBIDDEN,
  ERRORS_404_RESOURCE_NOT_FOUND,
  ERRORS_422_UNPROCESSABLE_CONTENT
} from "./cconstants"

const router = createBrowserRouter([
  {
    element: <HelpShellPicker />,
    children: [
      {
        path: "/help",
        element: <UserGuidePage />
      }
    ]
  },
  {
    element: <GuestApp />,
    children: [
      {
        path: "/",
        element: <PublicBrowseRedirect />
      },
      {
        path: "/browse",
        element: <PublicBrowseRedirect />
      },
      {
        path: "/browse/folder/:folderId",
        element: <PublicCatalogPage />
      },
      {
        path: "/browse/document/:documentId",
        element: <PublicDocumentPage />
      }
    ]
  },
  {
    path: "/login",
    element: <PostAuthRedirect />
  },
  {
    path: "/login/",
    element: <PostAuthRedirect />
  },
  // Auth-server redirects here after login. Must be top-level: under RR7 a
  // child `path: "/home"` of `path: "/"` does not match URL "/home" (404).
  {
    path: "/home",
    element: <PostAuthRedirect />
  },
  {
    path: "/home/:folderId",
    element: <PostAuthRedirect />
  },
  {
    element: <App />,
    errorElement: <ErrorPage />,
    children: [
      {
        path: "/inbox/:folderId",
        element: <Navigate to="/library/favorites" replace />
      },
      {
        path: "/folder/:folderId",
        element: <Folder />,
        loader: folderLoader
      },
      {
        path: "/document/:documentId",
        element: <Document />,
        loader: documentLoader
      },
      {
        path: "/library",
        element: <Navigate to="/library/favorites" replace />
      },
      {
        path: "/library/:section",
        element: <LibraryPage />
      },
      {
        path: "/search",
        element: <SearchPage />
      },
      {
        path: "/portal",
        element: <PortalHomeRedirect />
      },
      {
        path: "/portal/folder/:folderId",
        element: <PortalFolderPage />
      },
      {
        path: "/portal/feed",
        element: <PortalFeedPage />
      },
      {
        path: "/tags",
        element: <TagsList />
      },
      {
        path: "/tags/:tagId",
        element: <TagDetails />
      },
      {
        path: "/roles",
        element: <RolesList />
      },
      {
        path: "/roles/:roleId",
        element: <RoleDetails />
      },
      {
        path: "/users",
        element: <UsersList />
      },
      {
        path: "/users/:userId",
        element: <UserDetails />
      },
      {
        path: "/audit-log",
        element: <AuditLogPage />
      },
      {
        path: "/profile",
        element: <ProfilePage />
      },
      {
        path: ERRORS_403_ACCESS_FORBIDDEN,
        element: <AccessForbidden />
      },
      {
        path: ERRORS_404_RESOURCE_NOT_FOUND,
        element: <NotFound />
      },
      {
        path: ERRORS_422_UNPROCESSABLE_CONTENT,
        element: <UnprocessableContent />
      }
    ]
  }
])

export default router
