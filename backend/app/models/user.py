"""User-related Pydantic models."""
from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import datetime
import re


class UserResponse(BaseModel):
    """User profile response model."""
    id: str
    email: str
    full_name: Optional[str] = None
    interests: list[str] = []
    email_digest_enabled: bool = True
    preferred_digest_time: str = "09:00"  
    preferred_digest_timezone: str = "UTC"  
    onboarding_completed: bool = False
    created_at: datetime
    updated_at: datetime


class UserUpdate(BaseModel):
    """User profile update request model."""
    interests: Optional[list[str]] = None
    email_digest_enabled: Optional[bool] = None
    preferred_digest_time: Optional[str] = None  
    preferred_digest_timezone: Optional[str] = None 
    onboarding_completed: Optional[bool] = None
    
    @field_validator('preferred_digest_time')
    @classmethod
    def validate_time_format(cls, v):
        if v is None:
            return v
        # Validate format: "HH:MM" (24-hour format)
        pattern = r'^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$'
        if not re.match(pattern, v):
            raise ValueError('Time must be in 24-hour format "HH:MM" (e.g., "16:00" for 4pm, "09:30" for 9:30am)')
        return v
    
    @field_validator('onboarding_completed')
    @classmethod
    def validate_onboarding(cls, v):
        if v is None:
            return v
        if v is False:
            raise ValueError('Cannot set onboarding_completed to false')
        return v
