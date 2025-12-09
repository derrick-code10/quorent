"""Chat API endpoint for AI conversations."""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer
from app.core.auth import get_current_user
from app.core.database import get_user_db
from app.models.conversation import ChatRequest, ChatResponse, ChatSource
from app.services.chat_service import generate_chat_response, generate_title_from_message

router = APIRouter(prefix="/api/chat", tags=["chat"])
security = HTTPBearer()


@router.post("", response_model=ChatResponse)
async def chat(
    chat_request: ChatRequest,
    current_user: dict = Depends(get_current_user),
    credentials = Depends(security)
):
    """
    Send a message and get an AI response.
    Creates a new conversation if conversation_id is not provided.
    """
    user_id = current_user["id"]
    token = credentials.credentials
    
    try:
        user_db = get_user_db(token)
        conversation_id = chat_request.conversation_id
        
        if not conversation_id:
            title = generate_title_from_message(chat_request.message)
            
            # Create conversation
            conv_response = (
                user_db.table("conversations")
                .insert({
                    "user_id": user_id,
                    "title": title
                })
                .execute()
            )
            
            if not conv_response.data or len(conv_response.data) == 0:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to create conversation"
                )
            
            conversation_id = conv_response.data[0]["id"]
        else:
            # Verify conversation exists and belongs to user
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
        
        # Save user message
        user_msg_response = (
            user_db.table("messages")
            .insert({
                "conversation_id": conversation_id,
                "role": "user",
                "content": chat_request.message,
                "article_id": chat_request.article_id
            })
            .execute()
        )
        
        if not user_msg_response.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to save user message"
            )
        
        # Generate AI response
        answer, sources = await generate_chat_response(
            user_message=chat_request.message,
            conversation_id=conversation_id,
            user_id=user_id,
            token=token,
            article_id=chat_request.article_id
        )
        
        # Save assistant message
        assistant_msg_data = {
            "conversation_id": conversation_id,
            "role": "assistant",
            "content": answer
        }
        
        # Add sources if available
        if sources:
            assistant_msg_data["sources"] = sources
        
        assistant_msg_response = (
            user_db.table("messages")
            .insert(assistant_msg_data)
            .execute()
        )
        
        if not assistant_msg_response.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to save assistant message"
            )
        
        # Convert sources to ChatSource models
        chat_sources = [
            ChatSource(
                title=src["title"],
                url=src["url"],
                relevance=src.get("relevance")
            )
            for src in sources
        ]
        
        return ChatResponse(
            conversation_id=conversation_id,
            answer=answer,
            sources=chat_sources
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process chat message: {str(e)}"
        )