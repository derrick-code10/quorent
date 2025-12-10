"""Text manipulation utilities."""
from typing import Optional


def truncate_text(text: Optional[str], max_length: int = 200) -> str:
    """
    Truncate text at word boundaries, adding ellipsis if truncated.
    
    Args:
        text: Text to truncate
        max_length: Maximum length (default 200)
        
    Returns:
        Truncated text with ellipsis if needed
    """
    if not text or len(text) <= max_length:
        return text
    
    # Truncate to max_length and find last space before that point
    truncated = text[:max_length]
    last_space = truncated.rfind(' ')
    
    # If we found a space, truncate there
    if last_space > max_length * 0.7:  
        truncated = truncated[:last_space]
    
    # Remove trailing punctuation and add ellipsis
    truncated = truncated.rstrip('.,;:!?')
    return truncated + '...'
