"""Supabase database connection and client management."""
from supabase import create_client, Client
from app.core.config import settings


# Initialize Supabase client
def get_db() -> Client:
    """
    Get the Supabase database client.
    
    Returns:
        Client: The Supabase client instance
    """
    return create_client(
        settings.supabase_url,
        settings.supabase_key
    )

def get_user_db(token: str) -> Client:
    """
    Get Supabase client with user's JWT token for Row Level Security.
    
    Args:
        token: JWT token from the authenticated user
        
    Returns:
        Client: Supabase client with user context for RLS
    """
    client = create_client(settings.supabase_url, settings.supabase_key)
    client.auth.set_session(access_token=token, refresh_token="")
    return client

db: Client = get_db()
