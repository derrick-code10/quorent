"""Service for generating embeddings using OpenAI."""
from openai import OpenAI
from openai import APIError, RateLimitError, APIConnectionError
from app.core.config import settings
from fastapi import HTTPException, status

client = OpenAI(api_key=settings.openai_api_key)


def generate_embedding(text: str) -> list[float]:
    """
    Generate embedding for text using OpenAI.
    
    Args:
        text: Text to generate embedding for
        
    Returns:
        List of floats representing the embedding vector (1536 dimensions)
        
    Raises:
        HTTPException: If embedding generation fails
    """
    if not text or not text.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Query text cannot be empty"
        )
    
    try:
        response = client.embeddings.create(
            model="text-embedding-3-small",
            input=text.strip()
        )
        
        embedding = response.data[0].embedding
        
        # Validate embedding
        if not embedding:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="OpenAI returned empty embedding"
            )
        
        if len(embedding) != 1536:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Invalid embedding length: {len(embedding)}, expected 1536"
            )
        
        return embedding
        
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
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"OpenAI API error: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate embedding: {str(e)}"
        )