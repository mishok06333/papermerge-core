import {Anchor, Breadcrumbs, Stack, Text} from "@mantine/core"
import {Link, useParams} from "react-router-dom"
import {useTranslation} from "react-i18next"

import PostAuthRedirect from "@/features/auth/PostAuthRedirect"
import CitizenCategoryFoldersList from "@/features/citizen_categories/components/CitizenCategoryFoldersList"
import {useGetPublicCitizenCategoriesQuery} from "@/features/citizen_categories/citizenCategoriesApiSlice"
import {hasAuthCookie} from "@/features/public/guestMode"

export default function PublicCitizenCategoryDetailPage() {
  if (hasAuthCookie()) {
    return <PostAuthRedirect />
  }
  return <PublicCitizenCategoryDetailPageGuest />
}

function PublicCitizenCategoryDetailPageGuest() {
  const {t} = useTranslation()
  const {categoryId} = useParams<{categoryId: string}>()
  const {data: categories} = useGetPublicCitizenCategoriesQuery()
  const category = categories?.find(c => c.id === categoryId)

  if (!categoryId) {
    return null
  }

  return (
    <Stack gap="md" p="md">
      <Breadcrumbs separator="›">
        <Anchor
          component={Link}
          to="/browse/citizen-categories"
          size="sm"
        >
          {t("citizen_categories.nav")}
        </Anchor>
        <Text size="sm" fw={600}>
          {category?.name ?? "…"}
        </Text>
      </Breadcrumbs>
      {category?.description ? (
        <Text c="dimmed" size="sm">
          {category.description}
        </Text>
      ) : null}
      <CitizenCategoryFoldersList categoryId={categoryId} guest />
    </Stack>
  )
}
