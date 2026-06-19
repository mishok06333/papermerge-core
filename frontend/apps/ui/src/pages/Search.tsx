import SearchResults from "@/features/search/components/SearchResults"
import {mainPanelSwitchedToSearchResults} from "@/features/ui/uiSlice"
import {Stack, Title} from "@mantine/core"
import {useEffect} from "react"
import {useTranslation} from "react-i18next"
import {useDispatch} from "react-redux"
import {useSearchParams} from "react-router-dom"

export default function SearchPage() {
  const {t} = useTranslation()
  const dispatch = useDispatch()
  const [params] = useSearchParams()
  const query = params.get("q") ?? ""

  useEffect(() => {
    dispatch(mainPanelSwitchedToSearchResults(query))
  }, [dispatch, query])

  return (
    <Stack p="md" gap="md">
      <Title order={3}>{t("search.results_title", {query})}</Title>
      <SearchResults />
    </Stack>
  )
}
