import {Paper, Stack, Text, Title} from "@mantine/core"
import {useTranslation} from "react-i18next"

export default function UserGuidePage() {
  const {t} = useTranslation()

  return (
    <Stack p="md" gap="md">
      <Title order={3}>{t("user_guide.title")}</Title>
      <Paper withBorder p="lg">
        <Text c="dimmed">{t("user_guide.placeholder")}</Text>
      </Paper>
    </Stack>
  )
}
