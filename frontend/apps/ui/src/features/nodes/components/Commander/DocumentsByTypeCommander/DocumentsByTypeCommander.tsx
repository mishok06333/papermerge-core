import {useAppDispatch, useAppSelector} from "@/app/hooks"
import Pagination from "@/components/Pagination"
import PanelContext from "@/contexts/PanelContext"
import {useGetDocsByTypeQuery} from "@/features/document/store/apiSlice"
import {useDynamicHeight} from "@/features/nodes/hooks/useDynamicHeight"
import {
  commanderLastPageSizeUpdated,
  selectCommanderDocumentTypeID,
  selectLastPageSize
} from "@/features/ui/uiSlice"
import type {PanelMode} from "@/types"
import {Box, Checkbox, ScrollArea, Stack, Table} from "@mantine/core"
import {skipToken} from "@reduxjs/toolkit/query"
import {useContext, useRef, useState} from "react"

import {useTranslation} from "react-i18next"
import ActionButtons from "./ActionButtons"
import DocumentRow from "./DocumentRow"

export default function DocumentsByCategoryCommander() {
  const {t} = useTranslation()
  const mode: PanelMode = useContext(PanelContext)
  const dispatch = useAppDispatch()
  const lastPageSize = useAppSelector(s => selectLastPageSize(s, mode))
  const [pageSize, setPageSize] = useState<number>(lastPageSize)
  const [page, setPage] = useState<number>(1)
  const topActionsRef = useRef<HTMLDivElement>(null) // ActionButtons
  const tableHeaderRef = useRef<HTMLTableSectionElement>(null) // Table.Thead
  const paginationRef = useRef<HTMLDivElement>(null) // Pagination

  const remainingHeight = useDynamicHeight([
    topActionsRef,
    tableHeaderRef,
    paginationRef
  ])

  const currentDocumentTypeID = useAppSelector(s =>
    selectCommanderDocumentTypeID(s, mode)
  )
  const {data} = useGetDocsByTypeQuery(
    currentDocumentTypeID
      ? {
          document_type_id: currentDocumentTypeID,
          page_number: page,
          page_size: pageSize
        }
      : skipToken
  )

  const onPageNumberChange = (page: number) => {
    setPage(page)
  }

  const onPageSizeChange = (value: string | null) => {
    if (value) {
      const pSize = parseInt(value)
      setPageSize(pSize)
      // reset current page
      setPage(1)
      // remember last page size
      dispatch(commanderLastPageSizeUpdated({pageSize: pSize, mode}))
    }
  }

  if (!data || (data && data.items.length == 0)) {
    return (
      <Box>
        <Stack>
          <ActionButtons />
        </Stack>
        <Stack>{t("common.empty")}</Stack>
      </Box>
    )
  }

  const rows = data.items.map(n => <DocumentRow key={n.id} doc={n} />)

  return (
    <Box>
      <Stack ref={topActionsRef}>
        <ActionButtons />
      </Stack>
      <Stack>
        <ScrollArea mt={"md"} h={remainingHeight} type="auto">
          <Table layout="fixed" stickyHeader>
            <Table.Thead ref={tableHeaderRef}>
              <Table.Tr>
                <Table.Th style={{width: 50}}>
                  <Checkbox />
                </Table.Th>
                <Table.Th>Title</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>{rows}</Table.Tbody>
          </Table>
        </ScrollArea>
        <Box ref={paginationRef}>
          <Pagination
            pagination={{
              pageNumber: page,
              pageSize: pageSize,
              numPages: data.num_pages
            }}
            onPageNumberChange={onPageNumberChange}
            onPageSizeChange={onPageSizeChange}
            lastPageSize={lastPageSize}
          />
        </Box>
      </Stack>
    </Box>
  )
}
