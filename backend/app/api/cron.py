"""Cron job endpoints for scheduled tasks."""
from fastapi import APIRouter, Depends, HTTPException, status, Header, Body
from app.core.database import get_db
from app.services.email_digest_service import create_digest_for_user
from app.services.email_service import send_digest_email
from app.core.config import settings
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/cron", tags=["cron"])


async def verify_cron_token(x_cron_token: str = Header(..., alias="X-Cron-Token")):
    """Verify the cron secret token."""
    if x_cron_token != settings.cron_secret_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid cron token"
        )
    return True


class CreateDigestsRequest(BaseModel):
    """Request model for creating digests."""
    user_ids: Optional[List[str]] = None


class SendDigestsRequest(BaseModel):
    """Request model for sending digests."""
    digest_ids: Optional[List[str]] = None


@router.post("/create-digests")
async def create_digests(
    request: CreateDigestsRequest = Body(default=CreateDigestsRequest()),
    _token_verified: bool = Depends(verify_cron_token)
) -> Dict[str, Any]:
    """
    Create email digests for users who are due.
    
    If user_ids is provided, creates digests for those specific users.
    Otherwise, finds all users who are due for digests based on their
    preferred_digest_time and timezone.
    
    Protected by secret token.
    """
    db = get_db()
    
    try:
        # If user_ids provided, use them; otherwise find due users
        if request.user_ids:
            users_to_process = request.user_ids
        else:
            # Find users due for digests
            users_response = (
                db.table("users")
                .select("id, interests, email_digest_enabled")
                .eq("email_digest_enabled", True)
                .execute()
            )
            
            users_to_process = [
                user["id"] for user in (users_response.data or [])
                if user.get("interests")  # Only users with interests
            ]
        
        if not users_to_process:
            return {
                "success": True,
                "created": 0,
                "skipped": 0,
                "errors": []
            }
        
        created_count = 0
        skipped_count = 0
        errors = []
        
        # Process each user
        for user_id in users_to_process:
            try:
                # Get user's interests
                user_response = (
                    db.table("users")
                    .select("interests")
                    .eq("id", user_id)
                    .execute()
                )
                
                if not user_response.data:
                    skipped_count += 1
                    continue
                
                interests = user_response.data[0].get("interests", [])
                if not interests:
                    skipped_count += 1
                    continue
                
                # Check if digest already exists for today
                from datetime import datetime, timezone
                today = datetime.now(timezone.utc).date().isoformat()
                
                existing_digest = (
                    db.table("email_digests")
                    .select("id")
                    .eq("user_id", user_id)
                    .gte("created_at", today)
                    .execute()
                )
                
                if existing_digest.data and len(existing_digest.data) > 0:
                    skipped_count += 1
                    logger.debug(f"Digest already exists for user {user_id} today")
                    continue
                
                # Create digest
                result = await create_digest_for_user(
                    user_id=user_id,
                    interests=interests,
                    max_articles=settings.digest_max_articles
                )
                
                if result["success"]:
                    created_count += 1
                    logger.info(f"Created digest {result.get('digest_id')} for user {user_id}")
                else:
                    errors.append({
                        "user_id": user_id,
                        "error": result.get("error", "Unknown error")
                    })
                    logger.warning(f"Failed to create digest for user {user_id}: {result.get('error')}")
                    
            except Exception as e:
                error_msg = str(e)
                errors.append({
                    "user_id": user_id,
                    "error": error_msg
                })
                logger.error(f"Error processing user {user_id}: {e}")
                continue
        
        return {
            "success": True,
            "created": created_count,
            "skipped": skipped_count,
            "errors": errors
        }
        
    except Exception as e:
        logger.error(f"Error in create-digests cron job: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create digests: {str(e)}"
        )


@router.post("/send-digests")
async def send_digests(
    request: SendDigestsRequest = Body(default=SendDigestsRequest()),
    _token_verified: bool = Depends(verify_cron_token)
) -> Dict[str, Any]:
    """
    Send queued email digests.
    
    If digest_ids is provided, sends those specific digests.
    Otherwise, finds all queued digests and sends them.
    
    Protected by secret token.
    """
    db = get_db()
    
    try:
        # If digest_ids provided, use them; otherwise find queued digests
        if request.digest_ids:
            digests_to_send = request.digest_ids
        else:
            # Find all queued digests
            digests_response = (
                db.table("email_digests")
                .select("id, user_id")
                .eq("status", "queued")
                .execute()
            )
            
            digests_to_send = [d["id"] for d in (digests_response.data or [])]
        
        if not digests_to_send:
            return {
                "success": True,
                "sent": 0,
                "failed": 0,
                "errors": []
            }
        
        sent_count = 0
        failed_count = 0
        errors = []
        
        # Process each digest
        for digest_id in digests_to_send:
            try:
                # Get digest and user info
                digest_response = (
                    db.table("email_digests")
                    .select("user_id")
                    .eq("id", digest_id)
                    .execute()
                )
                
                if not digest_response.data:
                    failed_count += 1
                    errors.append({
                        "digest_id": digest_id,
                        "error": "Digest not found"
                    })
                    continue
                
                user_id = digest_response.data[0]["user_id"]
                
                # Get user email
                user_response = (
                    db.table("users")
                    .select("email, full_name")
                    .eq("id", user_id)
                    .execute()
                )
                
                if not user_response.data:
                    failed_count += 1
                    errors.append({
                        "digest_id": digest_id,
                        "error": "User not found"
                    })
                    continue
                
                user_email = user_response.data[0]["email"]
                user_name = user_response.data[0].get("full_name")
                
                # Send digest
                result = send_digest_email(
                    digest_id=digest_id,
                    user_id=user_id,
                    user_email=user_email,
                    user_name=user_name
                )
                
                if result["success"]:
                    sent_count += 1
                    logger.info(f"Sent digest {digest_id} to {user_email}")
                else:
                    failed_count += 1
                    errors.append({
                        "digest_id": digest_id,
                        "error": result.get("error", "Unknown error")
                    })
                    logger.warning(f"Failed to send digest {digest_id}: {result.get('error')}")
                    
            except Exception as e:
                error_msg = str(e)
                failed_count += 1
                errors.append({
                    "digest_id": digest_id,
                    "error": error_msg
                })
                logger.error(f"Error sending digest {digest_id}: {e}")
                continue
        
        return {
            "success": True,
            "sent": sent_count,
            "failed": failed_count,
            "errors": errors
        }
        
    except Exception as e:
        logger.error(f"Error in send-digests cron job: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send digests: {str(e)}"
        )

@router.post("/cleanup")
async def cleanup_old_cache(
    _token_verified: bool = Depends(verify_cron_token)
) -> Dict[str, Any]:
    """
    Manually trigger cleanup of old cache entries.
    Deletes news_cache entries older than 7 days.
    
    Protected by secret token.
    """
    db = get_db()
    
    try:
        from datetime import datetime, timedelta
        
        # Calculate date to delete (7 days ago)
        cutoff_date = (datetime.utcnow() - timedelta(days=7)).isoformat()
        
        # Count entries to delete
        count_response = (
            db.table("news_cache")
            .select("id")
            .lt("created_at", cutoff_date)
            .execute()
        )
        
        entries_to_delete = count_response.data or []
        deleted_count = len(entries_to_delete)
        
        if deleted_count == 0:
            return {
                "success": True,
                "deleted": 0,
                "message": "No old cache entries to clean up"
            }
        
        # Delete old entries
        delete_response = (
            db.table("news_cache")
            .delete()
            .lt("created_at", cutoff_date)
            .execute()
        )
        
        logger.info(f"Cleaned up {deleted_count} cache entries older than 7 days")
        
        return {
            "success": True,
            "deleted": deleted_count,
            "message": f"Successfully cleaned up {deleted_count} cache entries"
        }
        
    except Exception as e:
        logger.error(f"Error in cleanup cron job: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to cleanup old cache: {str(e)}"
        )