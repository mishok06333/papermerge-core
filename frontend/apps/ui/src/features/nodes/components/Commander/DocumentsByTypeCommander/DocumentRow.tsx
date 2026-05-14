import {useAppDispatch} from "@/app/hooks"
import {currentNodeChanged} from "@/features/ui/uiSlice"
import {Checkbox, Table} from "@mantine/core"
import {useNavigate} from "react-router-dom"

import type {DocumentCFV} from "@/types"

type Args = {
  doc: DocumentCFV
}

export default function DocumentRow({doc}: Args) {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  const onClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    if (e.ctrlKey || e.altKey) {
      dispatch(
        currentNodeChanged({id: doc.id, ctype: "document", panel: "secondary"})
      )
    } else {
      navigate(`/document/${doc.id}`)
    }
  }

  return (
    <Table.Tr>
      <Table.Td>
        <Checkbox />
      </Table.Td>
      <Table.Td>
        <a href="#" onClick={onClick}>
          {doc.title}
        </a>
      </Table.Td>
    </Table.Tr>
  )
}
