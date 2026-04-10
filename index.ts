import OpenAI from "openai";
import { createClient, DEFAULT_MODEL } from "./tools/openai.ts";
import { tavilySearch } from "./tools/tavily.ts";
import { getWeather } from "./tools/weather.ts";


const AGENT_SYSTEM_PROMPT = `
你是一个智能助手，可以调用工具查询天气和搜索互联网。请用中文回答，回答要简洁明了。当需要查询天气时，调用 get_weather 工具；当需要搜索互联网时，调用 tavily_search 工具。

# 可以调用的工具：
1. get_weather(city: string): 查询指定城市的当前天气信息（温度、湿度、风速等）
2. tavily_search(query: string, max_results?: number): 使用 Tavily 搜索引擎查询互联网，获取最新资讯、新闻、技术文档等，返回结果数量默认 5，最大 10。

# 回答格式要求
当调用工具时，必须严格按照以下格式输出，包含一对Thought和Action：
Thought: [你的思考过程和下一步计划]
Action: [你要执行的具体行动]

Action的格式必须是以下之一：
1. 调用工具：function_name(arg_name="arg_value")
2. 结束回答：Finish: [你的最终回答]

# 重要提示:
- 每次只输出一对Thought-Action
- Action必须在同一行，不要换行
- 当收集到足够信息可以回答用户问题时，必须使用 Action: Finish[最终答案] 格式结束

始终使用中文和我对话，请开始吧！

`

const tools: OpenAI.Chat.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "get_weather",
      description: "查询指定城市的当前天气信息（温度、湿度、风速等）",
      parameters: {
        type: "object",
        properties: {
          city: { type: "string", description: "城市名，如 Beijing、Shanghai、Tokyo" },
        },
        required: ["city"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "tavily_search",
      description: "使用 Tavily 搜索引擎查询互联网，获取最新资讯、新闻、技术文档等",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "搜索关键词或自然语言问题" },
          max_results: { type: "number", description: "返回结果数量，默认 5，最大 10" },
        },
        required: ["query"],
      },
    },
  },
];

// ─── Tool executor ───────────────────────────────────────────────────────────

async function executeTool(name: string, args: Record<string, unknown>): Promise<string> {
  if (name === "get_weather") {
    const result = await getWeather(args.city as string);
    const c = result.current;
    return JSON.stringify({
      city: result.city,
      temperature: `${c.temp_C}°C / ${c.temp_F}°F`,
      feelsLike: `${c.feelsLikeC}°C`,
      humidity: `${c.humidity}%`,
      description: c.weatherDesc,
      wind: `${c.windspeedKmph} km/h ${c.winddir16Point}`,
      visibility: `${c.visibility} km`,
      uvIndex: c.uvIndex,
    });
  }

  if (name === "tavily_search") {
    const result = await tavilySearch(args.query as string, {
      maxResults: (args.max_results as number) ?? 5,
      includeAnswer: true,
    });
    return JSON.stringify({
      answer: result.answer,
      results: result.results.map((r) => ({
        title: r.title,
        url: r.url,
        content: r.content.slice(0, 400),
      })),
    });
  }

  return `Unknown tool: ${name}`;
}

// ─── Agent loop ──────────────────────────────────────────────────────────────

async function runAgent(userPrompt: string) {
  const client = createClient();
  console.log(`\n用户提示词: ${userPrompt}\n`);

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    {
      role: "system",
      content: AGENT_SYSTEM_PROMPT,
    },
    { role: "user", content: userPrompt },
  ];
    // 向模型发送请求
    const response = await client.chat.completions.create({
      model: DEFAULT_MODEL,
      messages,
      tools,
      temperature: 0.3,
      stream: false
    });
    // 打印返回
    const message = response.choices[0]?.message;
    console.log(`响应成功: ${JSON.stringify(message, null, 2)}\n`);
    const toolCalls:OpenAI.Chat.Completions.ChatCompletionMessageToolCall[] = message?.tool_calls ?? [];
    console.log(`需要调用的工具: ${toolCalls.map((tool) => (tool as OpenAI.Chat.Completions.ChatCompletionMessageFunctionToolCall
).function.name).join(", ")}\n`);

}


await runAgent("北京今天天气怎么样？另外帮我搜索一下 2025年最受欢迎的 AI 编程工具有哪些？");
