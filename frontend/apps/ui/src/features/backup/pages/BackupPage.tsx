import {
  Alert,
  Button,
  Card,
  FileInput,
  Group,
  Loader,
  Modal,
  Stack,
  Text,
  Title
} from "@mantine/core"
import {IconAlertTriangle, IconDatabaseExport, IconDatabaseImport} from "@tabler/icons-react"
import {useState} from "react"
import {useSelector} from "react-redux"
import {useTranslation} from "react-i18next"

import {getBaseURL} from "@/utils"
import {selectCurrentUser} from "@/slices/currentUser"
import type {UserDetails} from "@/types"
import AccessForbidden from "@/pages/errors/AccessForbidden"

export default function BackupPage() {
  const {t} = useTranslation()
  const user = useSelector(selectCurrentUser) as UserDetails | null
  const [file, setFile] = useState<File | null>(null)
  const [restoreOpened, setRestoreOpened] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  if (!user) return <Loader />
  if (!user.is_superuser) return <AccessForbidden />

  const authHeaders = () => {
    const token = document.cookie
      .split("; ")
      .find(item => item.startsWith("access_token="))
      ?.split("=")[1]
    return token ? {Authorization: `Bearer ${decodeURIComponent(token)}`} : {}
  }

  const exportBackup = async () => {
    setBusy(true)
    setError(null)
    try {
      const response = await fetch(`${getBaseURL()}/api/admin/backup/export`, {
        headers: authHeaders()
      })
      if (!response.ok) {
        throw new Error(await response.text())
      }
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement("a")
      anchor.href = url
      anchor.download = "papermerge-backup.pmgbackup"
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      URL.revokeObjectURL(url)
    } catch (e) {
      setError(e instanceof Error ? e.message : t("backup.error"))
    } finally {
      setBusy(false)
    }
  }

  const importBackup = async () => {
    if (!file) return
    setBusy(true)
    setError(null)
    setSuccess(false)
    try {
      const formData = new FormData()
      formData.append("backup", file)
      const response = await fetch(`${getBaseURL()}/api/admin/backup/import`, {
        method: "POST",
        headers: authHeaders(),
        body: formData
      })
      if (!response.ok) {
        const body = await response.text()
        throw new Error(body || t("backup.restore_error"))
      }
      setSuccess(true)
      setRestoreOpened(false)
      setFile(null)
      window.setTimeout(() => window.location.reload(), 1500)
    } catch (e) {
      setError(e instanceof Error ? e.message : t("backup.restore_error"))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Stack p="md" gap="lg">
      <Title order={2}>{t("backup.title")}</Title>
      <Text c="dimmed">{t("backup.description")}</Text>

      {error ? <Alert color="red">{error}</Alert> : null}
      {success ? <Alert color="green">{t("backup.restore_success")}</Alert> : null}

      <Card withBorder padding="lg">
        <Stack gap="md">
          <Group wrap="nowrap" align="flex-start">
            <IconDatabaseExport size={28} />
            <div>
              <Text fw={600}>{t("backup.export_title")}</Text>
              <Text size="sm" c="dimmed">{t("backup.export_description")}</Text>
            </div>
          </Group>
          <Button
            leftSection={<IconDatabaseExport size={18} />}
            onClick={exportBackup}
            loading={busy}
          >
            {t("backup.export_button")}
          </Button>
        </Stack>
      </Card>

      <Card withBorder padding="lg">
        <Stack gap="md">
          <Group wrap="nowrap" align="flex-start">
            <IconDatabaseImport size={28} />
            <div>
              <Text fw={600}>{t("backup.import_title")}</Text>
              <Text size="sm" c="dimmed">{t("backup.import_description")}</Text>
            </div>
          </Group>
          <FileInput
            value={file}
            onChange={setFile}
            accept=".pmgbackup,.tar.gz,.tgz"
            placeholder={t("backup.file_placeholder")}
            clearable
          />
          <Button
            leftSection={<IconDatabaseImport size={18} />}
            disabled={!file}
            onClick={() => setRestoreOpened(true)}
            color="red"
          >
            {t("backup.import_button")}
          </Button>
        </Stack>
      </Card>

      <Alert icon={<IconAlertTriangle size={18} />} color="orange" title={t("backup.warning_title")}>
        {t("backup.warning")}
      </Alert>

      <Modal
        opened={restoreOpened}
        onClose={() => !busy && setRestoreOpened(false)}
        title={t("backup.confirm_title")}
        centered
      >
        <Stack>
          <Text>{t("backup.confirm_text")}</Text>
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setRestoreOpened(false)} disabled={busy}>
              {t("common.cancel")}
            </Button>
            <Button color="red" onClick={importBackup} loading={busy}>
              {t("backup.confirm_button")}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  )
}
