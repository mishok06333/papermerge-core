import {useAppSelector} from "@/app/hooks"
import {
  useGetLibraryNotificationsQuery,
  useMarkLibraryNotificationReadMutation
} from "@/features/library/libraryApiSlice"
import {USER_ME} from "@/scopes"
import {selectCurrentUser} from "@/slices/currentUser"
import type {User} from "@/types"
import {
  ActionIcon,
  Button,
  Group,
  Indicator,
  Loader,
  Paper,
  Popover,
  Stack,
  Text
} from "@mantine/core"
import {notifications} from "@mantine/notifications"
import {IconBell} from "@tabler/icons-react"
import Cookies from "js-cookie"
import * as React from "react"
import {useTranslation} from "react-i18next"
import {useNavigate} from "react-router-dom"
import {getWSURL} from "@/utils"

type NotificationPayload = {
  document_id?: string
  document_version_id?: string
  title?: string
  finished_at?: string
}

const NotificationsMenu: React.FC = () => {
  const {t} = useTranslation()
  const navigate = useNavigate()
  const user = useAppSelector(selectCurrentUser) as User | null
  const scopes = user?.scopes ?? []

  const hasScope = scopes.includes(USER_ME)
  const {data, isLoading, refetch} = useGetLibraryNotificationsQuery(50, {
    skip: !hasScope,
    pollingInterval: 60_000
  })
  const [markRead] = useMarkLibraryNotificationReadMutation()
  const [markingId, setMarkingId] = React.useState<string | null>(null)

  if (!hasScope) {
    return null
  }

  const unreadCount = data?.filter(n => !n.read_at).length ?? 0
  const rows = data ?? []

  React.useEffect(() => {
    if (!hasScope) {
      return
    }
    const baseWs = getWSURL()
    if (!baseWs) {
      return
    }
    const token = Cookies.get("access_token")
    const wsUrl = (() => {
      if (!token) {
        return baseWs
      }
      const sep = baseWs.includes("?") ? "&" : "?"
      return `${baseWs}${sep}token=${encodeURIComponent(token)}`
    })()
    const ws = new WebSocket(wsUrl)
    const onMessage = () => {
      // Refresh notifications immediately on server event.
      refetch()
    }
    ws.addEventListener("message", onMessage)
    return () => {
      ws.removeEventListener("message", onMessage)
      ws.close()
    }
  }, [hasScope, refetch])

  const parsePayload = (payload: string | null): NotificationPayload | null => {
    if (!payload) {
      return null
    }
    try {
      return JSON.parse(payload) as NotificationPayload
    } catch {
      return null
    }
  }

  const formatNotification = (kind: string, payload: string | null) => {
    const parsed = parsePayload(payload)
    if (kind === "ocr_completed" && parsed) {
      const docTitle = parsed.title || "документ"
      return {
        title: "OCR завершен",
        message: `Документ "${docTitle}" успешно распознан и готов к работе.`,
        documentId: parsed.document_id
      }
    }

    return {
      title: kind,
      message: payload || ""
    }
  }

  return (
    <Popover withArrow position="bottom-end" width={380}>
      <Popover.Target>
        <Indicator
          label={unreadCount > 0 ? unreadCount : undefined}
          disabled={unreadCount === 0}
          size={16}
        >
          <ActionIcon variant="subtle" color="gray">
            <IconBell />
          </ActionIcon>
        </Indicator>
      </Popover.Target>
      <Popover.Dropdown p="sm">
        <Text fw={600} mb="sm">
          {t("library.tab_notifications")}
        </Text>
        <Stack gap="sm" style={{maxHeight: 400, overflowY: "auto"}}>
          {isLoading ? (
            <Loader size="sm" />
          ) : (
            <>
              {rows.map(n => {
                const item = formatNotification(n.kind, n.payload)
                return (
                <Paper key={n.id} withBorder p="sm">
                  <Group justify="space-between">
                    <Stack gap={4}>
                      <Text size="sm" fw={600}>
                        {item.title}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {new Date(n.created_at).toLocaleString()}
                      </Text>
                      {item.message ? (
                        <Text size="sm">{item.message}</Text>
                      ) : null}
                      {item.documentId ? (
                        <Button
                          size="xs"
                          variant="subtle"
                          p={0}
                          justify="flex-start"
                          onClick={() => navigate(`/document/${item.documentId}`)}
                        >
                          Открыть документ
                        </Button>
                      ) : null}
                    </Stack>
                    {!n.read_at ? (
                      <Button
                        size="xs"
                        variant="light"
                        loading={markingId === n.id}
                        disabled={markingId !== null && markingId !== n.id}
                        onClick={async () => {
                          setMarkingId(n.id)
                          try {
                            await markRead(n.id).unwrap()
                          } catch {
                            notifications.show({
                              title: t("library.error"),
                              message: t("library.load_error"),
                              color: "red"
                            })
                          } finally {
                            setMarkingId(null)
                          }
                        }}
                      >
                        {t("library.mark_read")}
                      </Button>
                    ) : (
                      <Text size="xs" c="dimmed">
                        {t("library.read")}
                      </Text>
                    )}
                  </Group>
                </Paper>
              )})}
              {rows.length === 0 ? (
                <Text c="dimmed">{t("library.empty_notifications")}</Text>
              ) : null}
            </>
          )}
        </Stack>
      </Popover.Dropdown>
    </Popover>
  )
}

export default NotificationsMenu
