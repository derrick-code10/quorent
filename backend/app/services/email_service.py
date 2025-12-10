"""Email sending service using Resend."""
import resend
from typing import Dict, Any, Optional, List
from datetime import datetime
from app.core.config import settings
from app.core.database import get_db
from app.models.email_digest import DigestArticle
from pathlib import Path
from jinja2 import Environment, FileSystemLoader, select_autoescape
from app.utils.text_utils import truncate_text
from app.utils.date_utils import format_article_date, get_localized_date_str
from app.utils.article_utils import parse_articles_from_digest
from app.utils.timezone_utils import get_user_timezone
import logging

logger = logging.getLogger(__name__)

# Initialize Resend client
resend.api_key = settings.resend_api_key

# Setup Jinja2 environment for loading templates
_template_dir = Path(__file__).parent.parent / "templates" / "emails"
_jinja_env = Environment(
    loader=FileSystemLoader(str(_template_dir)),
    autoescape=select_autoescape(['html', 'xml'])
)
_jinja_env.filters['truncate'] = truncate_text
_jinja_env.filters['format_date'] = format_article_date

def _render_digest_html(
    articles: List[DigestArticle],
    summary: Optional[str],
    fallback_type: Optional[str],
    from_name: str
) -> str:
    """Render HTML email template."""
    template = _jinja_env.get_template("digest.html")
    
    return template.render(
        articles=articles,
        summary=summary,
        fallback_type=fallback_type,
        from_name=from_name
    )


def _render_digest_text(
    articles: List[DigestArticle],
    summary: Optional[str],
    fallback_type: Optional[str],
    from_name: str
) -> str:
    """Render plain text email template."""
    template = _jinja_env.get_template("digest_text.txt")
    
    return template.render(
        articles=articles,
        summary=summary,
        fallback_type=fallback_type,
        from_name=from_name
    )


def _update_digest_status(
    digest_id: str,
    status: str,
    error_message: Optional[str] = None
) -> None:
    """Update digest status in database."""
    db = get_db()
    
    update_data = {
        "status": status,
        "sent_at": datetime.utcnow().isoformat() if status == "sent" else None,
        "error_message": error_message
    }
    
    try:
        db.table("email_digests").update(update_data).eq("id", digest_id).execute()
        logger.info(f"Updated digest {digest_id} status to {status}")
    except Exception as e:
        logger.error(f"Failed to update digest {digest_id} status: {e}")
        raise


def send_digest_email(
    digest_id: str,
    user_id: str,
    user_email: str,
    user_name: Optional[str] = None
) -> Dict[str, Any]:
    """
    Send an email digest to a user.
    
    Args:
        digest_id: The digest ID to send
        user_id: User ID
        user_email: User's email address
        user_name: Optional user name for personalization
        
    Returns:
        Dictionary with result:
        {
            "success": bool,
            "email_id": Optional[str],  # Resend email ID
            "error": Optional[str]
        }
    """
    db = get_db()
    
    try:
        # Fetch digest from database
        response = (
            db.table("email_digests")
            .select("*")
            .eq("id", digest_id)
            .eq("user_id", user_id)
            .execute()
        )
        
        if not response.data or len(response.data) == 0:
            return {
                "success": False,
                "email_id": None,
                "error": "Digest not found"
            }
        
        digest_data = response.data[0]
        
        # Check if digest is queued
        if digest_data.get("status") != "queued":
            return {
                "success": False,
                "email_id": None,
                "error": f"Digest status is '{digest_data.get('status')}', cannot send"
            }
        
        # Parse articles using utility function
        articles_json = digest_data.get("articles", [])
        articles = parse_articles_from_digest(articles_json)
        
        # Render email templates
        summary = digest_data.get("summary")
        fallback_type = digest_data.get("fallback_type")
        from_name = settings.resend_from_name
        
        html_content = _render_digest_html(
            articles=articles,
            summary=summary,
            fallback_type=fallback_type,
            from_name=from_name
        )
        
        text_content = _render_digest_text(
            articles=articles,
            summary=summary,
            fallback_type=fallback_type,
            from_name=from_name
        )
        
        # Prepare email subject with user's local timezone
        user_timezone = get_user_timezone(user_id)
        date_str = get_localized_date_str(user_timezone)
        subject = f"Your Daily News Digest - {date_str}"
        
        # Prepare Resend params
        from_email = f"{from_name} <{settings.resend_from_email}>"
        
        params: resend.Emails.SendParams = {
            "from": from_email,
            "to": [user_email],
            "subject": subject,
            "html": html_content,
            "text": text_content,
            "tags": [
                {"name": "digest_id", "value": digest_id},
                {"name": "type", "value": "email_digest"},
                {"name": "user_id", "value": user_id}
            ]
        }
        
        if settings.resend_reply_to:
            params["reply_to"] = settings.resend_reply_to
        
        # Send email via Resend
        try:
            email_response = resend.Emails.send(params)
            
            # Extract email ID from response
            email_id = None
            if hasattr(email_response, 'id'):
                email_id = email_response.id
            elif isinstance(email_response, dict) and 'id' in email_response:
                email_id = email_response['id']
            
            # Update digest status to sent
            _update_digest_status(digest_id, "sent")
            
            logger.info(f"Successfully sent digest {digest_id} to {user_email} (Resend ID: {email_id})")
            
            return {
                "success": True,
                "email_id": email_id,
                "error": None
            }
            
        except Exception as e:
            error_msg = str(e)
            logger.error(f"Failed to send digest {digest_id} via Resend: {error_msg}")
            
            # Update digest status to failed
            _update_digest_status(digest_id, "failed", error_message=error_msg)
            
            return {
                "success": False,
                "email_id": None,
                "error": error_msg
            }
            
    except Exception as e:
        error_msg = f"Error processing digest {digest_id}: {str(e)}"
        logger.error(error_msg)
        
        # Try to update status to failed
        try:
            _update_digest_status(digest_id, "failed", error_message=error_msg)
        except:
            pass
        
        return {
            "success": False,
            "email_id": None,
            "error": error_msg
        }