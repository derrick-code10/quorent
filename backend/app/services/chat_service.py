"""Service for generating AI chat responses using LangChain."""
from langchain_openai import ChatOpenAI
from langchain.memory import ConversationBufferMemory
from langchain.chains import ConversationalRetrievalChain
from langchain.schema import BaseRetriever, Document
from langchain.callbacks.manager import CallbackManagerForRetrieverRun
from langchain.prompts import ChatPromptTemplate, SystemMessagePromptTemplate, HumanMessagePromptTemplate
from app.core.config import settings
from app.core.database import get_user_db
from app.services.embedding_service import generate_embedding
from fastapi import HTTPException, status
from typing import Optional, List, Dict, Any
from openai import APIError, RateLimitError, APIConnectionError
from pydantic import ConfigDict
import logging
from datetime import date, timedelta

logger = logging.getLogger(__name__)


def generate_title_from_message(message: str) -> str:
    """
    Generate a conversation title from the first user message.
    Simple truncation approach for MVP.
    
    Args:
        message: The first user message
        
    Returns:
        Truncated title (max 50 characters)
    """
    if not message:
        return "New Chat"
    
    # Remove extra whitespace
    cleaned = " ".join(message.split())
    
    # Truncate to 50 characters
    if len(cleaned) > 50:
        return cleaned[:47] + "..."
    
    return cleaned


class SupabaseArticleRetriever(BaseRetriever):
    """Custom retriever that uses Supabase match_articles RPC function."""
    
    model_config = ConfigDict(arbitrary_types_allowed=True)
    
    user_db: Any
    user_id: str
    article_id: Optional[str] = None

    @staticmethod
    def _classify_query_intent(query: str) -> str:
        """Classify query into simple intents for retrieval routing."""
        normalized = (query or "").lower()
        trend_markers = [
            "most frequent",
            "most common",
            "which topics",
            "top topics",
            "trends",
            "trending",
            "themes",
            "pattern",
            "appeared most",
        ]
        if any(marker in normalized for marker in trend_markers):
            return "trend"

        summary_markers = [
            "summarise my articles",
            "summarize my articles",
            "this week",
            "today",
            "latest",
            "recent",
            "what happened",
        ]
        if any(marker in normalized for marker in summary_markers):
            return "summary"

        return "fact"
    
    def _get_relevant_documents(
        self, query: str, *, run_manager: CallbackManagerForRetrieverRun
    ) -> List[Document]:
        """Retrieve relevant articles from Supabase using our custom RPC function."""
        try:
            # Generate embedding for query
            query_embedding = generate_embedding(query)
            
            documents = []
            
            # If article_id is provided, fetch that specific article first
            if self.article_id:
                article_response = (
                    self.user_db.table("articles")
                    .select("id,title,body,url")
                    .eq("id", self.article_id)
                    .eq("user_id", self.user_id)
                    .execute()
                )
                if article_response.data:
                    article = article_response.data[0]
                    # Combine title and body for document content
                    content = f"Title: {article.get('title', '')}\n\n{article.get('body', '') or ''}"
                    metadata = {
                        "id": article.get("id"),
                        "title": article.get("title", ""),
                        "url": article.get("url", ""),
                        "similarity": 1.0
                    }
                    documents.append(Document(page_content=content, metadata=metadata))

            intent = self._classify_query_intent(query)
            logger.info("Chat retrieval intent=%s", intent)

            if intent in {"summary", "trend"}:
                days_back = 14 if intent == "trend" else 7
                limit = 25 if intent == "trend" else 12
                week_cutoff = (date.today() - timedelta(days=days_back)).isoformat()
                recent_response = (
                    self.user_db.table("articles")
                    .select("id,title,body,url,fetch_date,created_at")
                    .eq("user_id", self.user_id)
                    .gte("fetch_date", week_cutoff)
                    .order("fetch_date", desc=True)
                    .order("created_at", desc=True)
                    .limit(limit)
                    .execute()
                )
                if recent_response.data:
                    for article in recent_response.data:
                        title = article.get("title", "")
                        body = article.get("body", "") or ""
                        body_preview = body[:2000] if len(body) > 2000 else body
                        content = f"Title: {title}\n\n{body_preview}"
                        metadata = {
                            "id": article.get("id"),
                            "title": title,
                            "url": article.get("url", ""),
                            "similarity": 0.0,
                        }
                        documents.append(Document(page_content=content, metadata=metadata))
                    return documents
                latest_response = (
                    self.user_db.table("articles")
                    .select("id,title,body,url,fetch_date,created_at")
                    .eq("user_id", self.user_id)
                    .order("created_at", desc=True)
                    .limit(limit)
                    .execute()
                )
                if latest_response.data:
                    for article in latest_response.data:
                        title = article.get("title", "")
                        body = article.get("body", "") or ""
                        body_preview = body[:2000] if len(body) > 2000 else body
                        content = f"Title: {title}\n\n{body_preview}"
                        metadata = {
                            "id": article.get("id"),
                            "title": title,
                            "url": article.get("url", ""),
                            "similarity": 0.0,
                        }
                        documents.append(Document(page_content=content, metadata=metadata))
                    return documents
            
            # Search for relevant articles using our RPC function
            search_response = self.user_db.rpc(
                "match_articles",
                {
                    "query_embedding": query_embedding,
                    "match_threshold": 0.15,
                    "match_count": 8,
                    "filter_user_id": self.user_id
                }
            ).execute()

            if not search_response.data:
                search_response = self.user_db.rpc(
                    "match_articles",
                    {
                        "query_embedding": query_embedding,
                        "match_threshold": 0.0,
                        "match_count": 12,
                        "filter_user_id": self.user_id
                    }
                ).execute()
            
            # Convert search results to LangChain Documents
            if search_response.data:
                for article in search_response.data:
                    title = article.get("title", "")
                    body = article.get("body", "") or ""
                    # Limit body length to avoid token limits
                    body_preview = body[:2000] if len(body) > 2000 else body
                    content = f"Title: {title}\n\n{body_preview}"
                    
                    metadata = {
                        "id": article.get("id"),
                        "title": title,
                        "url": article.get("url", ""),
                        "similarity": article.get("similarity", 0.0)
                    }
                    documents.append(Document(page_content=content, metadata=metadata))
            
            return documents
            
        except Exception as e:
            logger.error("SupabaseArticleRetriever failed: %s", e, exc_info=True)
            return []


async def generate_chat_response(
    user_message: str,
    conversation_id: str,
    user_id: str,
    token: str,
    article_id: Optional[str] = None
) -> tuple[str, List[Dict]]:
    """
    Generate AI response to user message using LangChain.
    Retrieves relevant articles using semantic search.
    
    Args:
        user_message: The user's message
        conversation_id: The conversation ID
        user_id: The user's ID
        token: JWT token for database access
        article_id: Optional article ID if message is about a specific article
        
    Returns:
        Tuple of (answer, sources) where sources is a list of article dicts
        
    Raises:
        HTTPException: If response generation fails
    """
    user_db = get_user_db(token)
    
    # Get conversation history for LangChain memory
    messages_response = (
        user_db.table("messages")
        .select("role,content")
        .eq("conversation_id", conversation_id)
        .order("created_at", desc=False)
        .execute()
    )
    
    # LangChain memory - automatically manages conversation history
    memory = ConversationBufferMemory(
        memory_key="chat_history",
        return_messages=True,
        output_key="answer"
    )
    
    # Load conversation history into LangChain memory.
    all_messages = messages_response.data or []
    history_messages = all_messages[:-1] if all_messages and all_messages[-1]["role"] == "user" else all_messages
    for msg in history_messages:
        if msg["role"] == "user":
            memory.chat_memory.add_user_message(msg["content"])
        elif msg["role"] == "assistant":
            memory.chat_memory.add_ai_message(msg["content"])
    
    # Create retriever with proper Pydantic model
    retriever = SupabaseArticleRetriever(
        user_db=user_db,
        user_id=user_id,
        article_id=article_id
    )
    
    # Initialize LLM
    llm = ChatOpenAI(
        model="gpt-5.4-mini",
        temperature=0.7,
        max_tokens=1500,
        api_key=settings.openai_api_key
    )
    
    system_prompt_template = """You are Quill, a helpful and trustworthy news assistant.

Answer the user in natural, human-sounding language using the retrieved article context and earlier messages in this conversation.

Guidelines:
- Ground your answer in the provided articles. Do not invent facts or add unsupported claims.
- If sources disagree, briefly point out the disagreement and cite both.
- If the context only partially answers the question, share what is supported and clearly state what is still unknown.
- If there is no relevant information at all, reply with exactly:
"The provided articles do not contain enough information to answer this question."
- Stay factual and balanced.

Writing style:
- Blend ChatGPT-like clarity with Claude-like warmth.
- Start with a direct answer, then add concise supporting detail.
- Use plain English and natural phrasing.
- Keep it concise by default, but expand when the user asks for more depth.
- Use short paragraphs; use "-" bullets only when they improve readability.
- Be approachable and calm, without being overly formal or overly casual.
- No markdown formatting (no headings, bold, italics, or code fences).

Retrieved article context:
{context}"""


    combine_docs_prompt = ChatPromptTemplate.from_messages([
        SystemMessagePromptTemplate.from_template(system_prompt_template),
        HumanMessagePromptTemplate.from_template("{question}")
    ])

    # Create conversational retrieval chain
    try:
        chain = ConversationalRetrievalChain.from_llm(
            llm=llm,
            retriever=retriever,
            memory=memory,
            return_source_documents=True,
            verbose=False,
            combine_docs_chain_kwargs={"prompt": combine_docs_prompt}
        )
        
        # Generate response - LangChain handles memory, retrieval, and LLM call
        result = chain.invoke({"question": user_message})
        
        answer = result.get("answer", "")
        source_documents = result.get("source_documents", [])
        
        if not answer:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="LangChain returned empty response"
            )
        
        # Extract and trim sources.
        raw_sources = []
        for doc in source_documents:
            metadata = doc.metadata
            raw_sources.append({
                "title": metadata.get("title", "Unknown"),
                "url": metadata.get("url", ""),
                "relevance": float(metadata.get("similarity", 0.0) or 0.0),
            })

        seen_keys = set()
        deduped_sources = []
        for src in raw_sources:
            key = (src["url"].strip().lower(), src["title"].strip().lower())
            if key in seen_keys:
                continue
            seen_keys.add(key)
            deduped_sources.append(src)

        # Keep top 5 sources by relevance score.
        sources = sorted(deduped_sources, key=lambda s: s["relevance"], reverse=True)[:5]
        
        return answer, sources
        
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
            detail=f"Failed to generate chat response: {str(e)}"
        )