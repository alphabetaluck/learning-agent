/**
 * OpenAI tool
 * Requires OPENAI_API_KEY environment variable
 * Optionally set OPENAI_BASE_URL to use a custom/compatible endpoint
 */

import OpenAI from "openai";

export const DEFAULT_MODEL = "gpt-5-mini";
const BASE_URL = process.env.OPENAI_BASE_URL || "http://kevin.heiyu.space:4141/v1";


export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export interface ChatOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

export function createClient() {
  const apiKey = 'xxxx';
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set");
  }
  return new OpenAI({
    apiKey,
    baseURL: BASE_URL,
  });
}

export async function chatCompletion(
  messages: ChatMessage[],
  options: ChatOptions = {}
): Promise<string> {
  const client = createClient();

  const allMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    ...(options.systemPrompt
      ? [{ role: "system" as const, content: options.systemPrompt }]
      : []),
    ...messages,
  ];

  const response = await client.chat.completions.create({
    model: options.model ?? DEFAULT_MODEL,
    messages: allMessages,
    temperature: options.temperature ?? 0.7,
    max_tokens: options.maxTokens,
  });

  return response.choices[0]?.message?.content ?? "";
}

export async function singleChat(
  prompt: string,
  options: ChatOptions = {}
): Promise<string> {
  return chatCompletion([{ role: "user", content: prompt }], options);
}
