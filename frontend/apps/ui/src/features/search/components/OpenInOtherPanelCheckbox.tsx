import {useDispatch} from "react-redux"

import {searchResultItemTargetUpdated} from "@/features/ui/uiSlice"
import {Checkbox} from "@mantine/core"
import {useTranslation} from "react-i18next"

export default function OpenInOtherPanelCheckbox() {
  const {t} = useTranslation()
  const dispatch = useDispatch()

  const onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const inOtherPanel = Boolean(event.currentTarget.checked)
    dispatch(searchResultItemTargetUpdated(inOtherPanel))
  }

  return (
    <Checkbox
      onChange={onChange}
      defaultChecked
      label={t("search.open_in_other_panel")}
    />
  )
}
