from functools import lru_cache

from fastapi import HTTPException
from supabase import Client, create_client

from . import config


def new_client() -> Client:
    """A fresh Supabase client. Used for sign-in so a user session never leaks
    into the shared data client."""
    if not config.SUPABASE_URL or not config.SUPABASE_SERVICE_KEY:
        raise HTTPException(500, "Server is missing Supabase configuration")
    return create_client(config.SUPABASE_URL, config.SUPABASE_SERVICE_KEY)


@lru_cache(maxsize=1)
def get_db() -> Client:
    """Shared client (service-role) used for all table reads/writes."""
    return new_client()
