from httpx import AsyncClient

from papermerge.core import types
from papermerge.core.features.auth import extract_token_data


async def test_get_current_user(token):
    token_data: types.TokenData = extract_token_data(token)

    assert token_data is not None


async def test_missing_token_returns_401(api_client: AsyncClient):
    response = await api_client.get("/users/me")
    assert response.status_code == 401
