"""Conversation management API endpoints"""
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.security import HTTPBearer
from app.core.auth import get_current_user
from app.core.database import get_user_db
from app.models.conversation import (
    ConversationListItem,
    ConversationListResponse,
    ConversationResponse,
    Message
)

router = APIRouter(prefix="/api/conversations", tags=["conversations"])
security = HTTPBearer()


@router.get("", response_model=ConversationListResponse)
async def list_conversations(
    current_user: dict = Depends(get_current_user),
    credentials = Depends(security),
    limit: int = Query(default=20, ge=1, le=100, description="Number of conversations to return"),
    offset: int = Query(default=0, ge=0, description="Number of conversations to skip")
):
    """
    List conversations for the current authenticated user.
    Supports pagination. Sorted by updated_at DESC (most recent first).
    """
    user_id = current_user["id"]
    token = credentials.credentials
    
    try:
        # Get client with user's JWT token for RLS
        user_db = get_user_db(token)
        
        # Build query
        query = user_db.table("conversations").select(
            "id,user_id,title,created_at,updated_at"
        ).eq("user_id", user_id).order("updated_at", desc=True)
        
        # Get total count
        count_query = user_db.table("conversations").select("id", count="exact").eq("user_id", user_id)
        count_response = count_query.execute()
        total = count_response.count if hasattr(count_response, 'count') else len(count_response.data) if count_response.data else 0
        
        # Apply pagination
        query = query.range(offset, offset + limit - 1)
        
        # Execute query
        response = query.execute()
        
        # Convert to response models
        conversations = [ConversationListItem(**conv) for conv in (response.data or [])]
        
        # Calculate has_more
        has_more = (offset + limit) < total
        
        return ConversationListResponse(
            conversations=conversations,
            total=total,
            limit=limit,
            offset=offset,
            has_more=has_more
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch conversations: {str(e)}"
        )


@router.get("/{conversation_id}", response_model=ConversationResponse)
async def get_conversation(
    conversation_id: str,
    current_user: dict = Depends(get_current_user),
    credentials = Depends(security)
):
    """
    Get a single conversation by ID with all messages.
    """
    user_id = current_user["id"]
    token = credentials.credentials
    
    try:
        user_db = get_user_db(token)
        
        # Query the conversation by ID
        conv_response = (
            user_db.table("conversations")
            .select("*")
            .eq("id", conversation_id)
            .execute()
        )
        
        if not conv_response.data or len(conv_response.data) == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Conversation not found"
            )
        
        conversation = conv_response.data[0]
        
        # Get all messages for this conversation
        messages_response = (
            user_db.table("messages")
            .select("*")
            .eq("conversation_id", conversation_id)
            .order("created_at", desc=False)  
            .execute()
        )
        
        messages = [Message(**msg) for msg in (messages_response.data or [])]
        
        return ConversationResponse(
            id=conversation["id"],
            user_id=conversation["user_id"],
            title=conversation["title"],
            created_at=conversation["created_at"],
            updated_at=conversation["updated_at"],
            messages=messages
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch conversation: {str(e)}"
        )


@router.delete("/{conversation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_conversation(
    conversation_id: str,
    current_user: dict = Depends(get_current_user),
    credentials = Depends(security)
):
    """
    Delete a conversation and all its messages (CASCADE).
    """
    user_id = current_user["id"]
    token = credentials.credentials
    
    try:
        user_db = get_user_db(token)
        
        # Verify the conversation exists and belongs to user
        conv_response = (
            user_db.table("conversations")
            .select("id,user_id")
            .eq("id", conversation_id)
            .execute()
        )
        
        if not conv_response.data or len(conv_response.data) == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Conversation not found"
            )
        
        if conv_response.data[0]["user_id"] != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
        
        # Delete conversation (messages will be CASCADE deleted)
        user_db.table("conversations").delete().eq("id", conversation_id).execute()
        
        return None
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete conversation: {str(e)}"
        )