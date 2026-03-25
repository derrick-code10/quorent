// Mirrors backend Pydantic models exactly.

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  interests: string[];
  email_digest_enabled: boolean;
  preferred_digest_time: string;
  preferred_digest_timezone: string;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface Article {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  url: string;
  image_url: string | null;
  source: string | null;
  author: string | null;
  published_at: string | null;
  sentiment: number | null;
  concepts: Record<string, unknown> | null;
  social_shares: number;
  fetch_date: string;
  created_at: string;
}

export interface ArticlesResponse {
  articles: Article[];
  total: number;
  limit: number;
  offset: number;
  has_more: boolean;
}

export interface Digest {
  id: string;
  user_id: string;
  summary: string | null;
  status: "queued" | "sent" | "failed";
  is_fallback: boolean;
  fallback_type: "cache" | "no_data" | null;
  created_at: string;
  sent_at: string | null;
  article_count: number;
}

export interface DigestsResponse {
  digests: Digest[];
  total: number;
  limit: number;
  offset: number;
  has_more: boolean;
}

export interface ChatSource {
  title: string;
  url: string;
  relevance: number | null;
}

export interface ChatRequest {
  message: string;
  conversation_id?: string;
  article_id?: string;
}

export interface ChatResponse {
  conversation_id: string;
  answer: string;
  sources: ChatSource[];
}

export interface ConversationListItem {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface ConversationListResponse {
  conversations: ConversationListItem[];
  total: number;
  limit: number;
  offset: number;
  has_more: boolean;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: "user" | "assistant";
  content: string;
  sources: ChatSource[] | null;
  article_id: string | null;
  created_at: string;
}

export interface ConversationResponse {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
  messages: Message[];
}
