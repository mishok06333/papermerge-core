import {Anchor, Breadcrumbs, Stack, Text} from "@mantine/core"
import {Link, useParams} from "react-router-dom"
import {useTranslation} from "react-i18next"

import PostAuthRedirect from "@/features/auth/PostAuthRedirect"
import CitizenCategoriesList from "@/features/citizen_categories/components/CitizenCategoriesList"
import {hasAuthCookie} from "@/features/public/guestMode"

export default function PublicCitizenCategoriesPage() {
  if (hasAuthCookie()) {
    return <PostAuthRedirect />
  }
  return <PublicCitizenCategoriesPageGuest />
}

function PublicCitizenCategoriesPageGuest() {
  const {t} = useTranslation()

  return (
    <Stack gap="md" p="md">
      <Text fw={600} size="lg">
        {t("citizen_categories.nav")}
      </Text>
      <Text c="dimmed" size="sm">
        {t("citizen_categories.hint")}
      </Text>
      <CitizenCategoriesList guest />
    </Stack>
  )
}
