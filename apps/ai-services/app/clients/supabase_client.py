"""Thin httpx wrapper for Supabase REST API with tenant isolation."""

import httpx
from ..config import settings


class SupabaseClient:
    """Lightweight async Supabase REST client for server-to-server calls."""

    def __init__(self) -> None:
        if not settings.supabase_url or not settings.supabase_service_role_key:
            raise RuntimeError("Supabase URL or service role key not configured")
        self.base_url = f"{settings.supabase_url}/rest/v1"
        self.headers = {
            "apikey": settings.supabase_service_role_key,
            "Authorization": f"Bearer {settings.supabase_service_role_key}",
            "Content-Type": "application/json",
            "Prefer": "return=representation",
        }

    async def query(
        self,
        table: str,
        *,
        select: str = "*",
        filters: dict[str, str] | None = None,
        order: str | None = None,
        limit: int | None = None,
    ) -> list[dict]:
        """Run a GET query against a Supabase table."""
        params: dict[str, str] = {"select": select}
        if filters:
            for key, value in filters.items():
                params[key] = value
        if order:
            params["order"] = order
        if limit:
            params["limit"] = str(limit)

        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{self.base_url}/{table}",
                headers=self.headers,
                params=params,
            )
            resp.raise_for_status()
            return resp.json()

    async def insert(self, table: str, data: dict) -> dict:
        """Insert a row into a Supabase table."""
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"{self.base_url}/{table}",
                headers=self.headers,
                json=data,
            )
            resp.raise_for_status()
            rows = resp.json()
            return rows[0] if isinstance(rows, list) and rows else rows

    async def update(
        self, table: str, filters: dict[str, str], data: dict
    ) -> dict | None:
        """Update rows matching filters."""
        params = dict(filters)
        async with httpx.AsyncClient() as client:
            resp = await client.patch(
                f"{self.base_url}/{table}",
                headers=self.headers,
                params=params,
                json=data,
            )
            resp.raise_for_status()
            rows = resp.json()
            return rows[0] if isinstance(rows, list) and rows else rows
