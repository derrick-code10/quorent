"""Article management API endpoints"""
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.security import HTTPBearer
from app.core.auth import get_current_user
from app.core.database import get_user_db
from app.models.article import ArticleListItem, ArticleListResponse, ArticleResponse, ArticleSearchRequest, ArticleSearchResult
from app.services.embedding_service import generate_embedding
from typing import Optional

router = APIRouter(prefix="/api/articles", tags=["articles"])
security = HTTPBearer()


@router.get("", response_model=ArticleListResponse)
async def list_articles(
    current_user: dict = Depends(get_current_user),
    credentials = Depends(security),
    limit: int = Query(default=20, ge=1, le=100, description="Number of articles to return"),
    offset: int = Query(default=0, ge=0, description="Number of articles to skip"),
    sort: str = Query(default="created_at", description="Field to sort by (created_at or published_at)"),
    order: str = Query(default="desc", description="Sort order (asc or desc)"),
    source: Optional[str] = Query(default=None, description="Filter by source"),
    fetch_date: Optional[str] = Query(default=None, description="Filter by fetch date (YYYY-MM-DD)")
):
    """
    List articles for the current authenticated user.
    Supports pagination, sorting, and filtering.
    """
    user_id = current_user["id"]
    token = credentials.credentials
    
    # Validate sort field
    if sort not in ["created_at", "published_at"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="sort must be 'created_at' or 'published_at'"
        )
    
    # Validate order
    if order not in ["asc", "desc"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="order must be 'asc' or 'desc'"
        )
    
    try:
        # Get client with user's JWT token for RLS
        user_db = get_user_db(token)
        
        # Build query
        query = user_db.table("articles").select(
            "id,user_id,title,description,url,image_url,source,author,published_at,sentiment,concepts,social_shares,fetch_date,created_at"
        ).eq("user_id", user_id)
        
        # Apply filters
        if source:
            query = query.eq("source", source)
        if fetch_date:
            query = query.eq("fetch_date", fetch_date)
        
        # Apply sorting
        query = query.order(sort, desc=(order == "desc"))
        
        # Get total count
        count_query = user_db.table("articles").select("id", count="exact").eq("user_id", user_id)
        if source:
            count_query = count_query.eq("source", source)
        if fetch_date:
            count_query = count_query.eq("fetch_date", fetch_date)
        
        count_response = count_query.execute()
        total = count_response.count if hasattr(count_response, 'count') else len(count_response.data) if count_response.data else 0
        
        # Apply pagination
        query = query.range(offset, offset + limit - 1)
        
        # Execute query
        response = query.execute()
        
        # Convert to response models
        articles = [ArticleListItem(**article) for article in (response.data or [])]
        
        # Calculate has_more
        has_more = (offset + limit) < total
        
        return ArticleListResponse(
            articles=articles,
            total=total,
            limit=limit,
            offset=offset,
            has_more=has_more
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch articles: {str(e)}"
        )
        

@router.get("/{article_id}", response_model=ArticleResponse)
async def get_article(
    article_id: str,
    current_user: dict = Depends(get_current_user),
    credentials = Depends(security)
):
    """
    Get a single article by ID.
    Returns the full article including body content.
    """
    user_id = current_user["id"]
    token = credentials.credentials
    
    try:
        user_db = get_user_db(token)
        
        # Query the article by ID
        response = (
            user_db.table("articles")
            .select("*")  
            .eq("id", article_id)
            .execute()
        )
        
        if not response.data or len(response.data) == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Article not found"
            )
        
        # Convert to response model
        return ArticleResponse(**response.data[0])
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch article: {str(e)}"
        )


@router.post("/search", response_model=list[ArticleSearchResult])
async def search_articles(
    search_request: ArticleSearchRequest,
    current_user: dict = Depends(get_current_user),
    credentials = Depends(security)
):
    """
    Semantic search for articles using vector embeddings.
    """
    user_id = current_user["id"]
    token = credentials.credentials
    
    try:
        # Generate embedding for the search query
        query_embedding = generate_embedding(search_request.query)
        
        # Get client with user's JWT token for RLS
        user_db = get_user_db(token)
        
        # Call the match_articles SQL function via RPC
        try:
            response = user_db.rpc(
                "match_articles",
                {
                    "query_embedding": query_embedding,
                    "match_threshold": search_request.threshold,
                    "match_count": search_request.limit,
                    "filter_user_id": user_id
                }
            ).execute()
        except Exception as rpc_error:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Database query failed: {str(rpc_error)}"
            )
        
        # Handle empty results
        if not response.data:
            return []
        
        # Convert to response models
        try:
            results = [ArticleSearchResult(**result) for result in response.data]
        except Exception as validation_error:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to parse search results: {str(validation_error)}"
            )
        
        return results
        
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        # Catch any unexpected errors
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to search articles: {str(e)}"
        )