import {NType, SearchResultNode} from "@/types"
import {Text} from "@mantine/core"
import {useTranslation} from "react-i18next"
import SearchResultItem from "./SearchResultItem"

type Args = {
  onClick: (n: NType, page?: number) => void
  items: Array<SearchResultNode>
}

export default function SearchResultItems({items, onClick}: Args) {
  const {t} = useTranslation()
  if (items?.length == 0) {
    return <Text my={"md"}>{t("search.nothing_found")}</Text>
  }

  const itemComponents = items?.map(i => (
    <SearchResultItem key={i.id} item={i} onClick={onClick} />
  ))

  return <div>{itemComponents}</div>
}
