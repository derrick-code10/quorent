"""Service for generating text summaries using OpenAI."""
from openai import OpenAI
from openai import APIError, RateLimitError, APIConnectionError
from app.core.config import settings
from fastapi import HTTPException, status
from typing import List, Dict, Any
import logging

logger = logging.getLogger(__name__)

client = OpenAI(api_key=settings.openai_api_key)


def generate_digest_summary(articles: List[Dict[str, Any]]) -> str:
    """
    Generate a concise summary of multiple news articles for an email digest.
    
    Args:
        articles: List of article dictionaries with at least 'title' and optionally 'description' or 'body'
        
    Returns:
        Concise summary text (2-3 paragraphs)
        
    Raises:
        HTTPException: If summary generation fails
    """
    if not articles:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot generate summary from empty article list"
        )
    
    # Prepare article content for summarization
    article_texts = []
    for article in articles:
        title = article.get("title", "").strip()
        if not title:
            continue
        
        description = article.get("description", "").strip()
        body = article.get("body", "").strip()
        
        if description:
            content = f"Title: {title}\nDescription: {description[:500]}"
        elif body:
            content = f"Title: {title}\nContent: {body[:500]}"
        else:
            content = f"Title: {title}"
        
        article_texts.append(content)
    
    if not article_texts:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No valid article content to summarize"
        )
    
    # Combine articles into a single prompt
    articles_content = "\n\n---\n\n".join(article_texts)
    
    # Limit total content to avoid token limits
    if len(articles_content) > 8000:
        articles_content = articles_content[:8000] + "..."
    
    system_prompt = """You are a news digest writer. Your job is to create a concise, engaging summary of multiple news articles.

Guidelines:
- Write 2-3 paragraphs that capture the key themes and most important stories
- Highlight the most significant news items
- Group related articles together when discussing themes
- Keep the tone professional and informative
- Focus on what matters most to the reader
- Do not include article titles or URLs in the summary
- Write in a flowing narrative style, not bullet points"""

    user_prompt = f"""Please summarize the following news articles into a concise digest:

{articles_content}"""

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.7,
            max_tokens=600  
        )
        
        summary = response.choices[0].message.content.strip()
        
        if not summary:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="OpenAI returned empty summary"
            )
        
        logger.info(f"Generated digest summary ({len(summary)} characters) for {len(articles)} articles")
        return summary
        
    except RateLimitError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="OpenAI API rate limit exceeded. Please try again later."
        )
    except APIConnectionError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Failed to connect to OpenAI API. Please try again later."
        )
    except APIError as e:
        logger.error(f"OpenAI API error during summarization: {e}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"OpenAI API error: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Unexpected error during summarization: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate summary: {str(e)}"
        )