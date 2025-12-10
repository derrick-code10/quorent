"""Article transformation utilities."""
from typing import Dict, Any, List
from app.models.email_digest import DigestArticle
from app.utils.date_utils import parse_published_at
import logging

logger = logging.getLogger(__name__)


def transform_to_digest_article(article: Dict[str, Any]) -> DigestArticle:
    """
    Transform a full article dict to a simplified DigestArticle.
    
    Args:
        article: Full article dictionary
        
    Returns:
        DigestArticle model
    """
    published_at = parse_published_at(article.get("published_at"))
    
    return DigestArticle(
        title=article.get("title", ""),
        url=article.get("url", ""),
        description=article.get("description"),
        source=article.get("source"),
        published_at=published_at,
        image_url=article.get("image_url")
    )


def parse_articles_from_digest(articles_json: list) -> List[DigestArticle]:
    """
    Parse articles from digest JSON data.
    
    Args:
        articles_json: List of article dictionaries from digest
        
    Returns:
        List of DigestArticle objects
    """
    articles = []
    
    if not isinstance(articles_json, list):
        return articles
    
    for article_dict in articles_json:
        try:
            article = transform_to_digest_article(article_dict)
            articles.append(article)
        except Exception as e:
            logger.warning(f"Failed to parse article: {e}")
            continue
    
    return articles
