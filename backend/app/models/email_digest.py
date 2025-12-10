"""Email digest-related Pydantic models."""
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class DigestArticle(BaseModel):
    """Simplified article for email digest."""
    title: str
    url: str
    description: Optional[str] = None
    source: Optional[str] = None
    published_at: Optional[datetime] = None
    image_url: Optional[str] = None


class EmailDigestListItem(BaseModel):
    """Email digest list item."""
    id: str
    user_id: str
    summary: Optional[str] = None
    status: str
    is_fallback: bool
    fallback_type: Optional[str] = None
    created_at: datetime
    sent_at: Optional[datetime] = None
    article_count: Optional[int] = None  


class EmailDigestResponse(BaseModel):
    """Full email digest response."""
    id: str
    user_id: str
    articles: List[DigestArticle]
    summary: Optional[str] = None
    status: str
    is_fallback: bool
    fallback_type: Optional[str] = None
    created_at: datetime
    sent_at: Optional[datetime] = None
    error_message: Optional[str] = None


class EmailDigestListResponse(BaseModel):
    """Paginated email digest list response."""
    digests: List[EmailDigestListItem]
    total: int
    limit: int
    offset: int
    has_more: bool

class SendDigestResponse(BaseModel):
    """Response model for sending email digest."""
    success: bool
    message: str
    email_id: Optional[str] = None