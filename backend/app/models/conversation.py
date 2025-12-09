"""Conversation-related Pydantic models."""
from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import datetime


class Message(BaseModel):
    """Message model."""
    id: str
    conversation_id: str
    role: str  # 'user' or 'assistant'
    content: str
    sources: Optional[dict] = None
    article_id: Optional[str] = None
    created_at: datetime


class ConversationListItem(BaseModel):
    """Conversation list item."""
    id: str
    user_id: str
    title: str
    created_at: datetime
    updated_at: datetime


class ConversationResponse(BaseModel):
    """Full conversation response with messages."""
    id: str
    user_id: str
    title: str
    created_at: datetime
    updated_at: datetime
    messages: list[Message]


class ConversationListResponse(BaseModel):
    """Paginated conversation list response."""
    conversations: list[ConversationListItem]
    total: int
    limit: int
    offset: int
    has_more: bool


class ChatRequest(BaseModel):
    """Chat request model for POST /api/chat."""
    message: str
    conversation_id: Optional[str] = None
    article_id: Optional[str] = None
    
    @field_validator('message')
    @classmethod
    def validate_message(cls, v):
        if not v or not v.strip():
            raise ValueError('message cannot be empty')
        return v.strip()


class ChatSource(BaseModel):
    """Source article referenced in chat response."""
    title: str
    url: str
    relevance: Optional[float] = None


class ChatResponse(BaseModel):
    """Chat response model."""
    conversation_id: str
    answer: str
    sources: list[ChatSource] = []