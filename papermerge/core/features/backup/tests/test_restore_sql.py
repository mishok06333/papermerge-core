from papermerge.core.features.backup.service import _is_unsupported_restore_guc


def test_pg17_transaction_timeout_is_stripped():
    assert _is_unsupported_restore_guc(b"SET transaction_timeout = 0;\n")
    assert _is_unsupported_restore_guc(b"  SET transaction_timeout = 0;\n")


def test_postgres16_session_settings_are_kept():
    assert not _is_unsupported_restore_guc(b"SET statement_timeout = 0;\n")
    assert not _is_unsupported_restore_guc(b"SET lock_timeout = 0;\n")
    assert not _is_unsupported_restore_guc(
        b"SET idle_in_transaction_session_timeout = 0;\n"
    )
    assert not _is_unsupported_restore_guc(b"COPY public.nodes (title) FROM stdin;\n")
