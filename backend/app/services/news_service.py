"""Service for fetching news articles from NewsAPI.ai."""
import asyncio
from datetime import datetime, date, timedelta
from typing import List, Dict, Any, Optional, Tuple
from app.core.config import settings
from app.core.database import get_db
from app.services.embedding_service import generate_embedding
import logging

logger = logging.getLogger(__name__)

# Import Event Registry SDK
from eventregistry import EventRegistry, QueryArticlesIter, QueryItems, ReturnInfo, ArticleInfoFlags

# Initialize Event Registry
def _get_event_registry() -> EventRegistry:
    """Get Event Registry instance."""
    return EventRegistry(apiKey=settings.newsai_api_key)


async def fetch_articles_from_newsapi(
    interests: List[str],
    max_articles: int = 50
) -> Tuple[List[Dict[str, Any]], bool]:
    """
    Fetch articles from NewsAPI.ai based on user interests.
    
    Args:
        interests: List of interest keywords/topics
        max_articles: Maximum number of articles to fetch (max 100 per request)
        
    Returns:
        Tuple of (articles_list, success_flag)
        - articles_list: List of article dictionaries
        - success_flag: True if fetch was successful, False otherwise
    """
    if not interests:
        logger.warning("No interests provided for news fetch")
        return [], False
    

    # clean and validate interests
    keywords = [interest.strip() for interest in interests if interest.strip()]
    
    if not keywords:
        logger.warning("No valid interests after processing")
        return [], False
    
    try:
        # Run SDK in thread pool since it's synchronous
        loop = asyncio.get_event_loop()
        articles_list = await loop.run_in_executor(
            None,
            _fetch_articles_sync,
            keywords,
            min(max_articles, 100)
        )
        
        if articles_list:
            logger.info(f"Successfully fetched {len(articles_list)} articles from NewsAPI.ai")
            return articles_list, True
        else:
            logger.warning("No articles returned from NewsAPI.ai")
            return [], True 
            
    except Exception as e:
        logger.error(f"Error fetching from NewsAPI.ai: {e}")
        import traceback
        logger.debug(traceback.format_exc())
        return [], False


def _fetch_articles_sync(keywords: List[str], max_articles: int) -> List[Dict[str, Any]]:
    """
    Synchronous function to fetch articles using Event Registry SDK.
    This runs in a thread pool to avoid blocking.
    """
    try:
        er = _get_event_registry()
        
        logger.info(f"Searching for articles with keywords: {keywords}")
        
        # Create query with OR condition for keywords
        q = QueryArticlesIter(
            keywords=QueryItems.OR(keywords),
            dataType=["news", "blog"],
            lang="eng",
            isDuplicateFilter="skipDuplicates",
            ignoreSourceGroupUri="paywall/paywalled_sources"
        )
        
        return_info = ReturnInfo(
            articleInfo=ArticleInfoFlags(
                bodyLen=-1,  
                body=True,
                title=True,
                url=True,
                image=True,
                concepts=True,  
                categories=True,
                socialScore=True,  
                sentiment=True,
                authors=True
            )
        )
        
        # Execute query and get articles
        articles = []
        for article in q.execQuery(
            er,
            sortBy="date",
            returnInfo=return_info,  
            maxItems=max_articles
        ):
            # Transform SDK article format to our format
            transformed = _transform_sdk_article(article)
            if transformed:
                articles.append(transformed)
        
        logger.info(f"Successfully fetched {len(articles)} articles")
        return articles
        
    except Exception as e:
        logger.error(f"Error in sync fetch: {e}")
        import traceback
        logger.debug(traceback.format_exc())
        return []


def _transform_sdk_article(article: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """
    Transform Event Registry SDK article format to our internal format.
    
    Args:
        article: Raw article from Event Registry SDK (matches Event Registry data model)
        
    Returns:
        Transformed article dictionary or None if invalid
    """
    try:
        # Extract required fields
        title = article.get("title", "").strip()
        url = article.get("url", "").strip()
        
        if not title or not url:
            return None
        
        # Extract body
        body = article.get("body", "") or ""
        
        # Extract description
        description = body[:500] if body else ""
        
        # Extract source information
        source_name = None
        source_info = article.get("source", {})
        if isinstance(source_info, dict):
            source_name = source_info.get("title", "")
        
        # Author - not available in Event Registry response
        author = None
        
        # Extract image
        image_url = article.get("image", "") or None
        
        # Extract published date (use dateTime or dateTimePub)
        published_at = None
        date_str = article.get("dateTime", "") or article.get("dateTimePub", "") or article.get("date", "")
        if date_str:
            try:
                if date_str.endswith("Z"):
                    date_str = date_str.replace("Z", "+00:00")
                published_at = datetime.fromisoformat(date_str)
            except Exception as e:
                logger.debug(f"Failed to parse date {date_str}: {e}")
                try:
                    # Try without timezone
                    published_at = datetime.strptime(date_str.split("+")[0].split("Z")[0], "%Y-%m-%dT%H:%M:%S")
                except:
                    try:
                        # Try date only format
                        published_at = datetime.strptime(date_str, "%Y-%m-%d")
                    except:
                        pass
        
        # Extract sentiment
        sentiment = article.get("sentiment")
        if sentiment is not None:
            try:
                sentiment = float(sentiment)
            except (ValueError, TypeError):
                sentiment = None
        
        # Extract concepts
        concepts_dict = {}
        concepts = article.get("concepts", [])
        if concepts and isinstance(concepts, list):
            for concept in concepts[:10]:
                if isinstance(concept, dict):
                    label_obj = concept.get("label", {})
                    if isinstance(label_obj, dict):
                        label = label_obj.get("eng", "")
                    else:
                        label = str(label_obj) if label_obj else ""
                    
                    score = concept.get("score", 0)
                    if label:
                        concepts_dict[label] = score
        
        # Extract social shares
        social_shares = 0
        shares = article.get("shares", {})
        if isinstance(shares, dict):
            social_shares = (
                shares.get("facebook", 0) +
                shares.get("googlePlus", 0) +
                shares.get("pinterest", 0) +
                shares.get("linkedIn", 0)
            )
        
        return {
            "title": title,
            "body": body,
            "description": description[:1000] if description else None,
            "url": url,
            "image_url": image_url,
            "source": source_name,
            "author": author,
            "published_at": published_at.isoformat() if published_at else None,
            "sentiment": sentiment,
            "concepts": concepts_dict if concepts_dict else None,
            "social_shares": social_shares
        }
        
    except Exception as e:
        logger.error(f"Error transforming article: {e}")
        import traceback
        logger.debug(traceback.format_exc())
        return None


async def get_cached_articles(
    user_id: str,
    days_back: int = 2
) -> List[Dict[str, Any]]:
    """
    Get cached articles from the last N days as fallback.
    
    Args:
        user_id: User ID
        days_back: Number of days to look back
        
    Returns:
        List of cached article dictionaries
    """
    try:
        db = get_db()
        
        # Calculate date threshold
        threshold_date = (date.today() - timedelta(days=days_back)).isoformat()
        
        # Query news_cache table
        response = (
            db.table("news_cache")
            .select("articles")
            .eq("user_id", user_id)
            .gte("fetch_date", threshold_date)
            .order("fetch_date", desc=True)
            .limit(1)
            .execute()
        )
        
        if response.data and len(response.data) > 0:
            cached_data = response.data[0].get("articles", [])
            if cached_data:
                logger.info(f"Retrieved {len(cached_data)} cached articles for user {user_id}")
                return cached_data
        
        return []
        
    except Exception as e:
        logger.error(f"Error retrieving cached articles: {e}")
        return []


async def cache_articles(
    user_id: str,
    articles: List[Dict[str, Any]],
    source: str = "newsapi"
) -> bool:
    """
    Cache articles in the news_cache table for fallback use.
    
    Args:
        user_id: User ID
        articles: List of article dictionaries
        source: Source of the articles (e.g., "newsapi")
        
    Returns:
        True if caching succeeded, False otherwise
    """
    if not articles:
        return False
    
    try:
        db = get_db()
        
        # Insert into news_cache
        cache_entry = {
            "user_id": user_id,
            "articles": articles,
            "fetch_date": date.today().isoformat(),
            "source": source
        }
        
        response = (
            db.table("news_cache")
            .insert(cache_entry)
            .execute()
        )
        
        logger.info(f"Cached {len(articles)} articles for user {user_id}")
        return True
        
    except Exception as e:
        logger.error(f"Error caching articles: {e}")
        return False


async def store_articles_with_embeddings(
    user_id: str,
    articles: List[Dict[str, Any]],
    fetch_date: Optional[date] = None
) -> Tuple[int, int]:
    """
    Store articles in the database with embeddings.
    Handles deduplication based on (user_id, url) unique constraint.
    
    Args:
        user_id: User ID
        articles: List of article dictionaries
        fetch_date: Date when articles were fetched (defaults to today)
        
    Returns:
        Tuple of (stored_count, skipped_count)
    """
    if not articles:
        return 0, 0
    
    if fetch_date is None:
        fetch_date = date.today()
    
    stored_count = 0
    skipped_count = 0
    
    db = get_db()
    
    for article in articles:
        try:
            # Generate embedding from title + body
            text_for_embedding = f"{article.get('title', '')} {article.get('body', '')}"
            if not text_for_embedding.strip():
                logger.warning(f"Skipping article with empty title and body: {article.get('url', 'unknown')}")
                skipped_count += 1
                continue
            
            # Generate embedding
            try:
                embedding = generate_embedding(text_for_embedding[:8000])
            except Exception as e:
                logger.warning(f"Failed to generate embedding for article {article.get('url', 'unknown')}: {e}")
                skipped_count += 1
                continue
            
            # Prepare article data
            article_data = {
                "user_id": user_id,
                "title": article.get("title", ""),
                "body": article.get("body"),
                "description": article.get("description"),
                "url": article.get("url", ""),
                "image_url": article.get("image_url"),
                "source": article.get("source"),
                "author": article.get("author"),
                "published_at": article.get("published_at"),
                "sentiment": article.get("sentiment"),
                "concepts": article.get("concepts"),
                "social_shares": article.get("social_shares", 0),
                "embedding": embedding,
                "fetch_date": fetch_date.isoformat()
            }
            
            # Insert article (ON CONFLICT -> skip duplicates)
            try:
                response = (
                    db.table("articles")
                    .insert(article_data)
                    .execute()
                )
                
                if response.data:
                    stored_count += 1
                else:
                    skipped_count += 1
                    
            except Exception as e:
                error_str = str(e).lower()
                if "duplicate" in error_str or "unique" in error_str or "conflict" in error_str:
                    skipped_count += 1
                    logger.debug(f"Duplicate article skipped: {article.get('url', 'unknown')}")
                else:
                    logger.error(f"Error storing article {article.get('url', 'unknown')}: {e}")
                    skipped_count += 1
                    
        except Exception as e:
            logger.error(f"Error processing article: {e}")
            skipped_count += 1
            continue
    
    logger.info(f"Stored {stored_count} articles, skipped {skipped_count} duplicates for user {user_id}")
    return stored_count, skipped_count


async def fetch_and_store_news_for_user(
    user_id: str,
    interests: List[str],
    max_articles: int = 50
) -> Dict[str, Any]:
    """
    Complete workflow: Fetch news, store with embeddings, and cache.
    Handles fallback to cache if NewsAPI fails.
    
    Args:
        user_id: User ID
        interests: List of user interests
        max_articles: Maximum articles to fetch
        
    Returns:
        Dictionary with results:
        {
            "success": bool,
            "articles_fetched": int,
            "articles_stored": int,
            "articles_skipped": int,
            "using_cache": bool,
            "error": Optional[str]
        }
    """
    if not interests:
        return {
            "success": False,
            "articles_fetched": 0,
            "articles_stored": 0,
            "articles_skipped": 0,
            "using_cache": False,
            "error": "No interests provided"
        }
    
    # Try fetching from Event Registry
    articles, fetch_success = await fetch_articles_from_newsapi(interests, max_articles)
    using_cache = False
    
    # If fetch failed, try cache fallback
    if not fetch_success or not articles:
        logger.warning(f"NewsAPI fetch failed for user {user_id}, trying cache fallback")
        articles = await get_cached_articles(user_id, days_back=2)
        using_cache = True
        
        if not articles:
            return {
                "success": False,
                "articles_fetched": 0,
                "articles_stored": 0,
                "articles_skipped": 0,
                "using_cache": True,
                "error": "NewsAPI fetch failed and no cache available"
            }
    
    # Cache the articles if they came from Event Registry
    if fetch_success and articles and not using_cache:
        await cache_articles(user_id, articles, source="newsapi")
    
    # Store articles with embeddings
    stored_count, skipped_count = await store_articles_with_embeddings(
        user_id,
        articles
    )
    
    return {
        "success": True,
        "articles_fetched": len(articles),
        "articles_stored": stored_count,
        "articles_skipped": skipped_count,
        "using_cache": using_cache,
        "error": None
    }