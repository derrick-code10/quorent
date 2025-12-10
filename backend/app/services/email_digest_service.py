"""Service for creating and managing email digests."""
from typing import List, Dict, Any, Optional
from datetime import datetime
from app.core.database import get_db
from app.services.news_service import fetch_and_store_news_for_user, get_cached_articles
from app.services.summarization_service import generate_digest_summary
from app.utils.article_utils import transform_to_digest_article
import logging

logger = logging.getLogger(__name__)


async def create_digest_for_user(
    user_id: str,
    interests: List[str],
    max_articles: int = 50
) -> Dict[str, Any]:
    """
    Create an email digest for a user.
    
    This function:
    1. Fetches articles based on user interests
    2. Generates a summary using AI
    3. Stores the digest in the database
    4. Handles fallback scenarios (cache, no data)
    
    Args:
        user_id: User ID
        interests: List of user interests/keywords
        max_articles: Maximum articles to fetch
        
    Returns:
        Dictionary with digest creation results:
        {
            "success": bool,
            "digest_id": Optional[str],
            "articles_count": int,
            "using_cache": bool,
            "error": Optional[str]
        }
    """
    db = get_db()
    
    if not interests:
        # Create digest with no_data fallback
        try:
            digest_data = {
                "user_id": user_id,
                "articles": [],
                "summary": None,
                "status": "queued",
                "is_fallback": True,
                "fallback_type": "no_data"
            }
            
            response = db.table("email_digests").insert(digest_data).execute()
            
            if response.data:
                logger.warning(f"Created digest with no_data fallback for user {user_id}")
                return {
                    "success": True,
                    "digest_id": response.data[0]["id"],
                    "articles_count": 0,
                    "using_cache": False,
                    "error": "No interests provided"
                }
        except Exception as e:
            logger.error(f"Error creating no_data digest: {e}")
            return {
                "success": False,
                "digest_id": None,
                "articles_count": 0,
                "using_cache": False,
                "error": str(e)
            }
    
    # Fetch articles
    fetch_result = await fetch_and_store_news_for_user(
        user_id=user_id,
        interests=interests,
        max_articles=max_articles
    )
    
    using_cache = fetch_result.get("using_cache", False)
    articles_fetched = fetch_result.get("articles_fetched", 0)
    
    if not fetch_result.get("success") or articles_fetched == 0:
        # Try cache fallback if not already using cache
        if not using_cache:
            logger.warning(f"News fetch failed for user {user_id}, trying cache fallback")
            cached_articles = await get_cached_articles(user_id, days_back=2)
            
            if cached_articles:
                articles_fetched = len(cached_articles)
                using_cache = True
            else:
                # Create digest with no_data fallback
                try:
                    digest_data = {
                        "user_id": user_id,
                        "articles": [],
                        "summary": None,
                        "status": "queued",
                        "is_fallback": True,
                        "fallback_type": "no_data"
                    }
                    
                    response = db.table("email_digests").insert(digest_data).execute()
                    
                    if response.data:
                        logger.warning(f"Created digest with no_data fallback for user {user_id}")
                        return {
                            "success": True,
                            "digest_id": response.data[0]["id"],
                            "articles_count": 0,
                            "using_cache": False,
                            "error": "No articles available"
                        }
                except Exception as e:
                    logger.error(f"Error creating no_data digest: {e}")
                    return {
                        "success": False,
                        "digest_id": None,
                        "articles_count": 0,
                        "using_cache": False,
                        "error": str(e)
                    }
        else:
            # Already tried cache, create no_data digest
            try:
                digest_data = {
                    "user_id": user_id,
                    "articles": [],
                    "summary": None,
                    "status": "queued",
                    "is_fallback": True,
                    "fallback_type": "no_data"
                }
                
                response = db.table("email_digests").insert(digest_data).execute()
                
                if response.data:
                    return {
                        "success": True,
                        "digest_id": response.data[0]["id"],
                        "articles_count": 0,
                        "using_cache": False,
                        "error": "No articles available"
                    }
            except Exception as e:
                return {
                    "success": False,
                    "digest_id": None,
                    "articles_count": 0,
                    "using_cache": False,
                    "error": str(e)
                }
    
    # Get articles from database
    try:
        # Get articles from the last fetch
        articles_response = (
            db.table("articles")
            .select("*")
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .limit(articles_fetched)
            .execute()
        )
        
        articles = articles_response.data or []
        
        if not articles:
            # Fallback: use cached articles if available
            if using_cache:
                cached_articles = await get_cached_articles(user_id, days_back=2)
                articles = cached_articles
            else:
                articles = []
        
        if not articles:
            # Create no_data digest
            digest_data = {
                "user_id": user_id,
                "articles": [],
                "summary": None,
                "status": "queued",
                "is_fallback": True,
                "fallback_type": "no_data"
            }
            
            response = db.table("email_digests").insert(digest_data).execute()
            
            return {
                "success": True,
                "digest_id": response.data[0]["id"] if response.data else None,
                "articles_count": 0,
                "using_cache": False,
                "error": "No articles available"
            }
        
        # Transform articles to digest format
        digest_articles = [transform_to_digest_article(article) for article in articles]
        # Serialize articles to JSON-compatible format
        articles_json = []
        for article in digest_articles:
            article_dict = article.model_dump()
            # Convert datetime to ISO format string if present
            if article_dict.get("published_at") and isinstance(article_dict["published_at"], datetime):
                article_dict["published_at"] = article_dict["published_at"].isoformat()
            articles_json.append(article_dict)
        
        # Generate summary
        summary = None
        try:
            # Convert DigestArticle back to dict for summarization 
            articles_for_summary = []
            for article in articles:
                articles_for_summary.append({
                    "title": article.get("title", ""),
                    "description": article.get("description"),
                    "body": article.get("body")
                })
            
            summary = generate_digest_summary(articles_for_summary)
        except Exception as e:
            logger.error(f"Failed to generate summary for user {user_id}: {e}")
        
        # Create digest record
        digest_data = {
            "user_id": user_id,
            "articles": articles_json,
            "summary": summary,
            "status": "queued",
            "is_fallback": using_cache,
            "fallback_type": "cache" if using_cache else None
        }
        
        response = db.table("email_digests").insert(digest_data).execute()
        
        if not response.data:
            return {
                "success": False,
                "digest_id": None,
                "articles_count": len(articles),
                "using_cache": using_cache,
                "error": "Failed to create digest record"
            }
        
        logger.info(f"Created digest {response.data[0]['id']} for user {user_id} with {len(articles)} articles")
        
        return {
            "success": True,
            "digest_id": response.data[0]["id"],
            "articles_count": len(articles),
            "using_cache": using_cache,
            "error": None
        }
        
    except Exception as e:
        logger.error(f"Error creating digest for user {user_id}: {e}")
        return {
            "success": False,
            "digest_id": None,
            "articles_count": 0,
            "using_cache": using_cache,
            "error": str(e)
        }