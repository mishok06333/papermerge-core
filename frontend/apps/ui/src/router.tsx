import {createBrowserRouter, Navigate} from "react-router-dom"

import App from "@/app/App.tsx"
import Folder, {loader as folderLoader} from "@/pages/Folder"

import {
  DocumentTypeDetails,
  DocumentTypesList
} from "@/features/document-types/pages"
import {GroupDetails, GroupsList} from "@/features/groups/pages"
import CategoryListView, {
  loader as categoryLoader
} from "@/features/nodes/pages/CategoryListView"
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

import {AccessForbidden, NotFound, UnprocessableContent} from "@/pages/errors"

import {loader as documentLoader} from "@/pages/Document"

import ErrorPage from "@/pages/Error.tsx"
import {
  ERRORS_403_ACCESS_FORBIDDEN,
  ERRORS_404_RESOURCE_NOT_FOUND,
  ERRORS_422_UNPROCESSABLE_CONTENT
} from "./cconstants"

const router = createBrowserRouter([
  {
    path: "/login",
    element: <Navigate to="/" replace />
  },
  {
    path: "/login/",
    element: <Navigate to="/" replace />
  },
  // Auth-server redirects here after login. Must be top-level: under RR7 a
  // child `path: "/home"` of `path: "/"` does not match URL "/home" (404).
  {
    path: "/home",
    element: <Navigate to="/library/favorites" replace />
  },
  {
    path: "/home/:folderId",
    element: <Navigate to="/library/favorites" replace />
  },
  {
    path: "/",
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
        path: "/category",
        element: <CategoryListView />,
        loader: categoryLoader
      },
      {
        path: "/category/:categoryId",
        element: <CategoryListView />,
        loader: categoryLoader
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
        path: "/document-types/",
        element: <DocumentTypesList />
      },
      {
        path: "/document-types/:documentTypeID",
        element: <DocumentTypeDetails />
      },
      {
        path: "/groups",
        element: <GroupsList />
      },
      {
        path: "/groups/:groupId",
        element: <GroupDetails />
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
