import {OWNER_ME} from "@/cconstants"
import {
  Button,
  ComboboxItem,
  Group,
  Loader,
  LoadingOverlay,
  Modal,
  Text,
  Textarea,
  TextInput
} from "@mantine/core"
import {useEffect, useState} from "react"

import OwnerSelector from "@/components/OwnerSelect/OwnerSelect"
import {
  useEditDocumentTypeMutation,
  useGetDocumentTypeQuery
} from "@/features/document-types/apiSlice"
import {useTranslation} from "react-i18next"

interface Args {
  opened: boolean
  documentTypeId: string
  onSubmit: () => void
  onCancel: () => void
}

export default function EditDocumentTypeModal({
  documentTypeId,
  onSubmit,
  onCancel,
  opened
}: Args) {
  const {t} = useTranslation()
  const [name, setName] = useState<string>("")
  const [pathTemplate, setPathTemplate] = useState<string>("")
  const [owner, setOwner] = useState<ComboboxItem>({label: OWNER_ME, value: ""})
  const [error, setError] = useState<string>("")

  const {data, isLoading} = useGetDocumentTypeQuery(documentTypeId)
  const [updateDocumentType, {isLoading: isLoadingGroupUpdate}] =
    useEditDocumentTypeMutation()

  useEffect(() => {
    formReset()
  }, [isLoading, data, opened])

  const formReset = () => {
    setError("")
    if (data) {
      setName(data.name || "")
      setPathTemplate(data.path_template || "")
      if (data.group_name && data.group_id) {
        setOwner({label: data.group_name, value: data.group_id})
      } else {
        setOwner({label: OWNER_ME, value: ""})
      }
    } else {
      setOwner({label: OWNER_ME, value: ""})
    }
  }

  const onLocalSubmit = async () => {
    const custom_field_ids = data?.custom_fields.map(cf => cf.id) ?? []
    const updatedDocumentType = {
      id: documentTypeId,
      name,
      path_template: pathTemplate,
      custom_field_ids
    }
    let dtData

    if (owner.value && owner.value != "") {
      dtData = {...updatedDocumentType, group_id: owner.value}
    } else {
      dtData = updatedDocumentType
    }
    try {
      await updateDocumentType(dtData).unwrap()
    } catch (err: unknown) {
      // @ts-ignore
      setError(err.data?.detail ?? `${err}`)
      return
    }
    setError("")
    formReset()
    onSubmit()
  }

  const onLocalCancel = () => {
    formReset()
    onCancel()
  }

  return (
    <Modal
      title={t("document_types.edit.title")}
      opened={opened}
      size="lg"
      onClose={onLocalCancel}
    >
      <LoadingOverlay
        visible={data == null || isLoading}
        zIndex={1000}
        overlayProps={{radius: "sm", blur: 2}}
      />
      <TextInput
        value={name}
        onChange={e => setName(e.currentTarget.value)}
        label={t("document_types.form.name")}
        placeholder={t("document_types.form.name")}
      />
      <Textarea
        label={t("document_types.form.path_template")}
        resize="vertical"
        autosize
        minRows={6}
        value={pathTemplate}
        onChange={event => setPathTemplate(event.currentTarget.value)}
      />
      <OwnerSelector value={owner} onChange={setOwner} />
      {error ? <Text c="red">{error}</Text> : null}
      <Group justify="space-between" mt="md">
        <Button variant="default" onClick={onLocalCancel}>
          {t("common.cancel")}
        </Button>
        <Group>
          {isLoadingGroupUpdate && <Loader size="sm" />}
          <Button disabled={isLoadingGroupUpdate} onClick={onLocalSubmit}>
            {t("common.update")}
          </Button>
        </Group>
      </Group>
    </Modal>
  )
}
