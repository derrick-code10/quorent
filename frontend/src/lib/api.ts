import type {
  UserProfile,
  Article,
  ArticlesResponse,
  Digest,
  DigestsResponse,
  ChatRequest,
  ChatResponse,
  ConversationListItem,
  ConversationListResponse,
  ConversationResponse,
} from "../types/api";

const API_URL = import.meta.env.VITE_API_URL as string;

async function request<T>(
  path: string,
  token: string,
  options: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });
  if (!res.ok) {
    try {
      const body = await res.clone().json();
      if (body?.detail) {
        const detail = body.detail;
        if (typeof detail === "string") throw new Error(detail);
        if (Array.isArray(detail) && detail[0]?.msg) throw new Error(detail[0].msg);
      }
    } catch (inner) {
      if (inner instanceof Error && inner.message !== `API ${res.status}`) throw inner;
    }
    throw new Error(`API ${res.status}: ${path}`);
  }
  if (res.status === 204 || res.headers.get("content-length") === "0") {
    return undefined as T;
  }
  return res.json() as Promise<T>;
}

export function getUser(token: string): Promise<UserProfile> {
  return request<UserProfile>("/api/users/me", token);
}

export function updateUser(
  token: string,
  payload: Partial<
    Pick<
      UserProfile,
      | "interests"
      | "email_digest_enabled"
      | "preferred_digest_time"
      | "preferred_digest_timezone"
      | "onboarding_completed"
    >
  >,
): Promise<UserProfile> {
  return request<UserProfile>("/api/users/me", token, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function getArticles(
  token: string,
  params: { limit?: number; offset?: number } = {},
): Promise<{ articles: Article[]; total: number; has_more: boolean }> {
  const qs = new URLSearchParams();
  if (params.limit !== undefined) qs.set("limit", String(params.limit));
  if (params.offset !== undefined) qs.set("offset", String(params.offset));
  const query = qs.toString() ? `?${qs}` : "";
  const data = await request<ArticlesResponse>(`/api/articles${query}`, token);
  return {
    articles: data.articles,
    total: data.total,
    has_more: data.has_more,
  };
}

export async function getDigests(
  token: string,
  params: { limit?: number } = {},
): Promise<{ digests: Digest[]; total: number }> {
  const qs = new URLSearchParams();
  if (params.limit !== undefined) qs.set("limit", String(params.limit));
  const query = qs.toString() ? `?${qs}` : "";
  const data = await request<DigestsResponse>(
    `/api/email-digests${query}`,
    token,
  );
  return { digests: data.digests, total: data.total };
}

export async function getLatestDigest(token: string): Promise<Digest | null> {
  const { digests } = await getDigests(token, { limit: 1 });
  return digests[0] ?? null;
}

export function sendChat(token: string, payload: ChatRequest): Promise<ChatResponse> {
  return request<ChatResponse>("/api/chat", token, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getConversations(
  token: string,
  params: { limit?: number; offset?: number } = {},
): Promise<{ conversations: ConversationListItem[]; total: number; has_more: boolean }> {
  const qs = new URLSearchParams();
  if (params.limit !== undefined) qs.set("limit", String(params.limit));
  if (params.offset !== undefined) qs.set("offset", String(params.offset));
  const query = qs.toString() ? `?${qs}` : "";
  const data = await request<ConversationListResponse>(`/api/conversations${query}`, token);
  return { conversations: data.conversations, total: data.total, has_more: data.has_more };
}

export function getConversation(token: string, id: string): Promise<ConversationResponse> {
  return request<ConversationResponse>(`/api/conversations/${id}`, token);
}

export function deleteConversation(token: string, id: string): Promise<void> {
  return request<void>(`/api/conversations/${id}`, token, { method: "DELETE" });
}
