"""User management API endpoints"""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer
from app.core.auth import get_current_user
from app.core.database import db, get_user_db
from app.models.user import UserResponse, UserUpdate

router = APIRouter(prefix="/api/users", tags=["users"])
security = HTTPBearer()


@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(
    current_user: dict = Depends(get_current_user),
    credentials = Depends(security)
):
    """
    Get the current authenticated user's profile.
    """
    user_id = current_user["id"]
    token = credentials.credentials
    
    try:
        # Get client with user's JWT token
        user_db = get_user_db(token)
        
        # Query the users table
        response = user_db.table("users").select("*").eq("id", user_id).execute()
        
        if not response.data or len(response.data) == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User profile not found"
            )
        
        return response.data[0]
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch user profile: {str(e)}"
        )


@router.put("/me", response_model=UserResponse)
async def update_current_user_profile(
    user_update: UserUpdate,
    current_user: dict = Depends(get_current_user),
    credentials = Depends(security)
):
    """
    Update the current user's profile
    """
    user_id = current_user["id"]
    token = credentials.credentials
    
    # Build update dict
    update_data = {}
    if user_update.interests is not None:
        update_data["interests"] = user_update.interests
    if user_update.email_digest_enabled is not None:
        update_data["email_digest_enabled"] = user_update.email_digest_enabled
    if user_update.preferred_digest_time is not None:
        update_data["preferred_digest_time"] = user_update.preferred_digest_time
    if user_update.preferred_digest_timezone is not None:
        update_data["preferred_digest_timezone"] = user_update.preferred_digest_timezone
    if user_update.onboarding_completed is not None:
        update_data["onboarding_completed"] = user_update.onboarding_completed
    
    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields to update"
        )
    
    try:
        # Get client with user's JWT token
        user_db = get_user_db(token)
        
        # Update the user in Supabase
        response = (
            user_db.table("users")
            .update(update_data)
            .eq("id", user_id)
            .execute()
        )
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User profile not found"
            )
        
        return response.data[0]
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update user profile: {str(e)}"
        )


@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
async def delete_current_user_account(
    current_user: dict = Depends(get_current_user),
):
    """
    Permanently delete the current authenticated user's account.
    This removes the auth user and cascades related application data.
    """
    user_id = current_user["id"]

    try:
        db.auth.admin.delete_user(user_id)
        return None
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete account: {str(e)}"
        )
