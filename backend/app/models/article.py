"""Article-related Pydantic models."""
from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import datetime, date


class ArticleResponse(BaseModel):
    """Full article response model."""
    id: str
    user_id: str
    title: str
    body: Optional[str] = None
    description: Optional[str] = None
    url: str
    image_url: Optional[str] = None
    source: Optional[str] = None
    author: Optional[str] = None
    published_at: Optional[datetime] = None
    sentiment: Optional[float] = None
    concepts: Optional[dict] = None
    social_shares: int = 0
    fetch_date: date
    created_at: datetime


class ArticleListItem(BaseModel):
    """Article list item."""
    id: str
    user_id: str
    title: str
    description: Optional[str] = None
    url: str
    image_url: Optional[str] = None
    source: Optional[str] = None
    author: Optional[str] = None
    published_at: Optional[datetime] = None
    sentiment: Optional[float] = None
    concepts: Optional[dict] = None
    social_shares: int = 0
    fetch_date: date
    created_at: datetime


class ArticleListResponse(BaseModel):
    """Paginated article list response."""
    articles: list[ArticleListItem]
    total: int
    limit: int
    offset: int
    has_more: bool


class ArticleSearchRequest(BaseModel):
    """Article search request model."""
    query: str
    limit: int = 10
    threshold: float = 0.7
    
    @field_validator('limit')
    @classmethod
    def validate_limit(cls, v):
        if v < 1 or v > 50:
            raise ValueError('limit must be between 1 and 50')
        return v
    
    @field_validator('threshold')
    @classmethod
    def validate_threshold(cls, v):
        if v < 0 or v > 1:
            raise ValueError('threshold must be between 0 and 1')
        return v


class ArticleSearchResult(BaseModel):
    """Article search result with similarity score."""
    id: str
    title: str
    body: Optional[str] = None
    url: str
    similarity: float
    published_at: Optional[datetime] = None
    source: Optional[str] = None
    image_url: Optional[str] = None