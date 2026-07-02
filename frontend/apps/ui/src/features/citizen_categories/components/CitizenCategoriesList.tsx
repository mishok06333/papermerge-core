import {
  Anchor,
  Group,
  Loader,
  Paper,
  Stack,
  Text,
  ThemeIcon
} from "@mantine/core"
import {IconChevronRight, IconUsers} from "@tabler/icons-react"
import {useMemo} from "react"
import {Link} from "react-router-dom"
import {useTranslation} from "react-i18next"

import {
  useGetCitizenCategoriesQuery,
  useGetPublicCitizenCategoriesQuery,
  type CitizenCategory
} from "@/features/citizen_categories/citizenCategoriesApiSlice"

type Props = {
  guest?: boolean
}

function CategoryList({
  categories,
  guest,
  emptyMessage
}: {
  categories: CitizenCategory[]
  guest?: boolean
  emptyMessage: string
}) {
  const {t} = useTranslation()

  if (categories.length === 0) {
    return (
      <Paper withBorder p="xl" radius="md">
        <Text c="dimmed" ta="center">
          {emptyMessage}
        </Text>
      </Paper>
    )
  }

  const base = guest ? "/browse/citizen-categories" : "/citizen-categories"

  return (
    <Stack gap="sm">
      {categories.map(cat => (
        <Paper
          key={cat.id}
          withBorder
          p="sm"
          radius="md"
          shadow="xs"
          styles={{
            root: {
              transition: "background-color 120ms ease",
              "&:hover": {
                backgroundColor: "var(--mantine-color-default-hover)"
              }
            }
          }}
        >
          <Anchor
            component={Link}
            to={`${base}/${cat.id}`}
            underline="never"
            c="var(--mantine-color-text)"
            display="block"
          >
            <Group wrap="nowrap" gap="md" justify="space-between">
              <Group wrap="nowrap" gap="md" style={{minWidth: 0}}>
                <ThemeIcon
                  variant="light"
                  color="blue"
                  size="lg"
                  radius="md"
                  aria-hidden
                >
                  <IconUsers size={20} stroke={1.5} />
                </ThemeIcon>
                <Stack gap={2} style={{minWidth: 0}}>
                  <Text fw={500} size="md" truncate="end">
                    {cat.name}
                  </Text>
                  {cat.description ? (
                    <Text size="sm" c="dimmed" lineClamp={2}>
                      {cat.description}
                    </Text>
                  ) : null}
                  <Text size="xs" c="dimmed">
                    {t("citizen_categories.folder_count", {
                      count: cat.folder_count
                    })}
                  </Text>
                </Stack>
              </Group>
              <IconChevronRight
                size={18}
                stroke={1.5}
                color="var(--mantine-color-dimmed)"
                style={{flexShrink: 0}}
                aria-hidden
              />
            </Group>
          </Anchor>
        </Paper>
      ))}
    </Stack>
  )
}

export default function CitizenCategoriesList({guest = false}: Props) {
  const {t} = useTranslation()
  const authQuery = useGetCitizenCategoriesQuery(undefined, {skip: guest})
  const publicQuery = useGetPublicCitizenCategoriesQuery(undefined, {
    skip: !guest
  })

  const {data, isLoading, isError} = guest ? publicQuery : authQuery

  const categories = useMemo(
    () => (data ? [...data].sort((a, b) => a.name.localeCompare(b.name, undefined, {sensitivity: "base"})) : []),
    [data]
  )

  if (isLoading) {
    return <Loader p="md" />
  }

  if (isError) {
    return (
      <Text p="md" c="dimmed">
        {t("citizen_categories.load_error")}
      </Text>
    )
  }

  return (
    <CategoryList
      categories={categories}
      guest={guest}
      emptyMessage={t("citizen_categories.empty")}
    />
  )
}
