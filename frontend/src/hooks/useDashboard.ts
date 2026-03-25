import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { getUser, getArticles, getLatestDigest } from "../lib/api";
import type { UserProfile, Article, Digest } from "../types/api";

export const PAGE_SIZE = 8;

interface DashboardState {
  token: string | null;
  user: UserProfile | null;
  articles: Article[];
  articleCount: number;
  digest: Digest | null;
  page: number;
  totalPages: number;
  loadingUser: boolean;
  loadingArticles: boolean;
  loadingDigest: boolean;
  articlesError: string | null;
  goToPage: (p: number) => void;
}

export function useDashboard(): DashboardState {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [articleCount, setArticleCount] = useState(0);
  const [digest, setDigest] = useState<Digest | null>(null);
  const [page, setPage] = useState(1);

  const [loadingUser, setLoadingUser] = useState(true);
  const [loadingArticles, setLoadingArticles] = useState(true);
  const [loadingDigest, setLoadingDigest] = useState(true);
  const [articlesError, setArticlesError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setToken(data.session.access_token);
    });
  }, []);

  useEffect(() => {
    if (!token) return;

    getUser(token)
      .then(setUser)
      .catch(() => {})
      .finally(() => setLoadingUser(false));

    getLatestDigest(token)
      .then(setDigest)
      .catch(() => {})
      .finally(() => setLoadingDigest(false));
  }, [token]);

  useEffect(() => {
    if (!token) return;

    getArticles(token, { limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE })
      .then(({ articles, total }) => {
        setArticles(articles);
        setArticleCount(total);
      })
      .catch((err: Error) => setArticlesError(err.message))
      .finally(() => setLoadingArticles(false));
  }, [token, page]);

  const totalPages = Math.max(1, Math.ceil(articleCount / PAGE_SIZE));

  function goToPage(p: number) {
    if (p < 1 || p > totalPages || p === page) return;
    setLoadingArticles(true);
    setArticlesError(null);
    setPage(p);
  }

  return {
    token,
    user,
    articles,
    articleCount,
    digest,
    page,
    totalPages,
    loadingUser,
    loadingArticles,
    loadingDigest,
    articlesError,
    goToPage,
  };
}
