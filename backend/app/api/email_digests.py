"""Email digest API endpoints"""
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.security import HTTPBearer
from app.core.auth import get_current_user
from app.core.database import get_user_db
from app.models.email_digest import (
    EmailDigestListItem,
    EmailDigestListResponse,
    EmailDigestResponse,
    DigestArticle,
    SendDigestResponse
)
from typing import Optional
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/email-digests", tags=["email-digests"])
security = HTTPBearer()


@router.get("", response_model=EmailDigestListResponse)
async def list_email_digests(
    current_user: dict = Depends(get_current_user),
    credentials = Depends(security),
    limit: int = Query(default=20, ge=1, le=100, description="Number of digests to return"),
    offset: int = Query(default=0, ge=0, description="Number of digests to skip"),
    status_filter: Optional[str] = Query(default=None, description="Filter by status (queued, sent, failed)")
):
    """
    List email digests for the current authenticated user.
    Supports pagination and status filtering.
    """
    user_id = current_user["id"]
    token = credentials.credentials
    
    # Validate status filter
    if status_filter and status_filter not in ["queued", "sent", "failed"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="status_filter must be 'queued', 'sent', or 'failed'"
        )
    
    try:
        user_db = get_user_db(token)
        
        # Build query
        query = user_db.table("email_digests").select(
            "id,user_id,summary,status,is_fallback,fallback_type,created_at,sent_at"
        ).eq("user_id", user_id)
        
        # Apply status filter
        if status_filter:
            query = query.eq("status", status_filter)
        
        # Apply sorting
        query = query.order("created_at", desc=True)
        
        # Get total count
        count_query = user_db.table("email_digests").select("id", count="exact").eq("user_id", user_id)
        if status_filter:
            count_query = count_query.eq("status", status_filter)
        
        count_response = count_query.execute()
        total = count_response.count if hasattr(count_response, 'count') else len(count_response.data) if count_response.data else 0
        
        # Apply pagination
        query = query.range(offset, offset + limit - 1)
        
        # Execute query
        response = query.execute()
        
        # Convert to response models and add article_count
        digests = []
        for digest_data in (response.data or []):
            # Get article count from articles JSONB field
            articles = digest_data.get("articles", [])
            article_count = len(articles) if isinstance(articles, list) else 0
            
            digest_item = EmailDigestListItem(
                **digest_data,
                article_count=article_count
            )
            digests.append(digest_item)
        
        # Calculate has_more
        has_more = (offset + limit) < total
        
        return EmailDigestListResponse(
            digests=digests,
            total=total,
            limit=limit,
            offset=offset,
            has_more=has_more
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error listing email digests: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch email digests: {str(e)}"
        )


@router.get("/{digest_id}", response_model=EmailDigestResponse)
async def get_email_digest(
    digest_id: str,
    current_user: dict = Depends(get_current_user),
    credentials = Depends(security)
):
    """
    Get a single email digest by ID.
    Returns the full digest including articles and summary.
    """
    user_id = current_user["id"]
    token = credentials.credentials
    
    try:
        user_db = get_user_db(token)
        
        # Query the digest by ID
        response = (
            user_db.table("email_digests")
            .select("*")
            .eq("id", digest_id)
            .execute()
        )
        
        if not response.data or len(response.data) == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Email digest not found"
            )
        
        digest_data = response.data[0]
        
        # Convert articles JSONB to DigestArticle models
        articles_json = digest_data.get("articles", [])
        articles = []
        
        if isinstance(articles_json, list):
            for article_dict in articles_json:
                try:
                    # Handle published_at conversion
                    published_at = None
                    if article_dict.get("published_at"):
                        if isinstance(article_dict["published_at"], str):
                            from datetime import datetime
                            try:
                                published_at = datetime.fromisoformat(
                                    article_dict["published_at"].replace("Z", "+00:00")
                                )
                            except:
                                pass
                        elif isinstance(article_dict["published_at"], datetime):
                            published_at = article_dict["published_at"]
                    
                    article = DigestArticle(
                        title=article_dict.get("title", ""),
                        url=article_dict.get("url", ""),
                        description=article_dict.get("description"),
                        source=article_dict.get("source"),
                        published_at=published_at,
                        image_url=article_dict.get("image_url")
                    )
                    articles.append(article)
                except Exception as e:
                    logger.warning(f"Failed to parse article in digest {digest_id}: {e}")
                    continue
        
        # Convert to response model
        return EmailDigestResponse(
            id=digest_data["id"],
            user_id=digest_data["user_id"],
            articles=articles,
            summary=digest_data.get("summary"),
            status=digest_data["status"],
            is_fallback=digest_data.get("is_fallback", False),
            fallback_type=digest_data.get("fallback_type"),
            created_at=digest_data["created_at"],
            sent_at=digest_data.get("sent_at"),
            error_message=digest_data.get("error_message")
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching email digest {digest_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch email digest: {str(e)}"
        )


@router.post("/{digest_id}/send", response_model=SendDigestResponse)
async def send_email_digest(
    digest_id: str,
    current_user: dict = Depends(get_current_user),
    credentials = Depends(security)
):
    """
    Send an email digest to the current user.
    Only digests with status 'queued' can be sent.
    """
    user_id = current_user["id"]
    user_email = current_user["email"]
    token = credentials.credentials
    
    try:
        user_db = get_user_db(token)
        
        # Check if user has email digests enabled
        user_response = user_db.table("users").select("email_digest_enabled").eq("id", user_id).execute()
        
        if user_response.data and len(user_response.data) > 0:
            email_digest_enabled = user_response.data[0].get("email_digest_enabled", True)
            if not email_digest_enabled:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email digests are disabled for this user"
                )
        
        # Import here to avoid circular imports
        from app.services.email_service import send_digest_email
        
        # Send the email
        result = send_digest_email(
            digest_id=digest_id,
            user_id=user_id,
            user_email=user_email,
            user_name=current_user.get("user_metadata", {}).get("full_name")
        )
        
        if result["success"]:
            return SendDigestResponse(
                success=True,
                message="Email digest sent successfully",
                email_id=result.get("email_id")
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to send email: {result.get('error', 'Unknown error')}"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error sending email digest {digest_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send email digest: {str(e)}"
        )