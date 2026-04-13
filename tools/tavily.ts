/**
 * Tavily search tool
 * Requires TAVILY_API_KEY environment variable
 */

import { tavily } from "@tavily/core";

export interface TavilySearchOptions {
  maxResults?: number;
  searchDepth?: "basic" | "advanced";
  includeAnswer?: boolean;
  includeDomains?: string[];
  excludeDomains?: string[];
}

export interface TavilySearchResult {
  query: string;
  answer?: string;
  results: Array<{
    title: string;
    url: string;
    content: string;
    score: number;
  }>;
}
function getClient() {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) {
    throw new Error("TAVILY_API_KEY is not set");
  }
  return tavily({ apiKey });
}

export async function tavilySearch(
  query: string,
  options: TavilySearchOptions = {}
): Promise<TavilySearchResult> {
  const client = getClient();

  const response = await client.search(query, {
    maxResults: options.maxResults ?? 5,
    searchDepth: options.searchDepth ?? "basic",
    includeAnswer: options.includeAnswer ?? true,
    includeDomains: options.includeDomains,
    excludeDomains: options.excludeDomains,
  });

  return {
    query,
    answer: response.answer,
    results: response.results.map((r) => ({
      title: r.title,
      url: r.url,
      content: r.content,
      score: r.score,
    })),
  };
}



/** 根据城市和天气搜索推荐的旅游景点 */
export async function getAttraction(city: string, weather: string): Promise<TavilySearchResult> {
  const query = `根据城市 ${city} 和天气 ${weather} 推荐的旅游景点`;
  return tavilySearch(query, { maxResults: 5 });
}
