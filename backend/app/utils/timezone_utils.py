"""Timezone utility functions."""
from app.core.database import get_db
import logging

logger = logging.getLogger(__name__)


def get_user_timezone(user_id: str) -> str:
    """
    Get user's preferred timezone from database.
    
    Args:
        user_id: User ID
        
    Returns:
        User's timezone string (defaults to "UTC")
    """
    db = get_db()
    
    try:
        user_response = (
            db.table("users")
            .select("preferred_digest_timezone")
            .eq("id", user_id)
            .execute()
        )
        
        if user_response.data and len(user_response.data) > 0:
            timezone = user_response.data[0].get("preferred_digest_timezone", "UTC")
            return timezone if timezone else "UTC"
    except Exception as e:
        logger.warning(f"Could not fetch user timezone for {user_id}: {e}, using UTC")
    
    return "UTC"
