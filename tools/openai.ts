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

  // 向模型发送请求
  const response = await client.chat.completions.create({
    model: options.model ?? DEFAULT_MODEL,
    messages: allMessages,
    // 用于控制生成文本的随机程度，值越高（如 0.8）模型会更倾向于生成多样化和创造性的文本，而值较低（如 0.2）则会使输出更集中和确定性。默认值通常是 1.0。
    temperature: options.temperature ?? 0.7,
    // 用于限制生成文本的最大长度，单位是 token。一个 token 可以是一个单词或一个子词，具体取决于模型的分词方式。设置 maxTokens 可以防止生成过长的文本，默认值通常是 2048 或更高。
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
