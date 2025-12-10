"""Date and time formatting utilities."""
from datetime import datetime
from zoneinfo import ZoneInfo
from typing import Optional


def format_article_date(dt: Optional[datetime]) -> str:
    """
    Format article published date without timezone conversion.
    Ensures the date shown matches the article's original publication date.
    
    Args:
        dt: Datetime object (may be timezone-aware or naive)
        
    Returns:
        Formatted date string (e.g., "December 09, 2025")
    """
    if not dt:
        return ""
    
    # If timezone-aware, convert to UTC to get the correct date
    # (article dates should be displayed as their original date, not converted)
    if dt.tzinfo is not None:
        # Get the UTC date
        utc_dt = dt.astimezone(ZoneInfo("UTC"))
        return utc_dt.strftime('%B %d, %Y')
    else:
        # Naive datetime, format as-is
        return dt.strftime('%B %d, %Y')


def parse_published_at(published_at: any) -> Optional[datetime]:
    """
    Parse published_at from various formats (string, datetime, None).
    
    Args:
        published_at: Can be a string, datetime object, or None
        
    Returns:
        Parsed datetime object or None
    """
    if not published_at:
        return None
    
    if isinstance(published_at, datetime):
        return published_at
    
    if isinstance(published_at, str):
        try:
            return datetime.fromisoformat(published_at.replace("Z", "+00:00"))
        except Exception:
            return None
    
    return None


def get_localized_date_str(user_timezone: str = "UTC") -> str:
    """
    Get current date string in user's timezone.
    
    Args:
        user_timezone: User's timezone (e.g., "America/New_York", "UTC")
        
    Returns:
        Formatted date string (e.g., "December 09, 2025")
    """
    try:
        utc_now = datetime.now(ZoneInfo("UTC"))
        user_tz = ZoneInfo(user_timezone)
        local_time = utc_now.astimezone(user_tz)
        return local_time.strftime("%B %d, %Y")
    except Exception:
        # Fallback to UTC if timezone is invalid
        return datetime.now(ZoneInfo("UTC")).strftime("%B %d, %Y")
