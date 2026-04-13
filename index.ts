import OpenAI from "openai";
import { createClient, DEFAULT_MODEL } from "./tools/openai.ts";
import { getAttraction, tavilySearch } from "./tools/tavily.ts";
import { getWeather } from "./tools/weather.ts";


const AGENT_SYSTEM_PROMPT = `
你是一个智能助手，可以调用工具查询天气和搜索互联网。请用中文回答，回答要简洁明了。当需要查询天气时，调用 get_weather 工具；当需要搜索旅游景点时，调用 get_attraction 工具。

# 可以调用的工具：
1. get_weather(city: string): 查询指定城市的当前天气信息（温度、湿度、风速等）
2. get_attraction(city: string, weather: string): 根据城市和天气搜索推荐的旅游景点。

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
      name: "get_attraction",
      description: "根据城市和天气搜索推荐的旅游景点",
      parameters: {
        type: "object",
        properties: {
          city: { type: "string", description: "城市名，如 Beijing、Shanghai、Tokyo" },
          weather: { type: "string", description: "天气情况，如晴天、雨天、雪天" },
        },
        required: ["city", "weather"],
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
  if(name === "get_attraction"){
    const result = await getAttraction(args.city as string, args.weather as string);
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

const MAX_ITERATIONS = 10;

async function runAgent(userPrompt: string) {
  const client = createClient();
  console.log(`\n用户提示词: ${userPrompt}\n`);

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: AGENT_SYSTEM_PROMPT },
    { role: "user", content: userPrompt },
  ];

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    console.log(`\n─── 第 ${i + 1} 轮 ───`);

    const response = await client.chat.completions.create({
      model: DEFAULT_MODEL,
      messages,
      tools,
      temperature: 0.3,
      stream: false,
    });

    const message = response.choices[0]?.message;
    const finishReason = response.choices[0]?.finish_reason;

    // 将本轮 assistant 消息追加到历史
    messages.push(message);

    const toolCalls: OpenAI.Chat.ChatCompletionMessageFunctionToolCall[] = (message?.tool_calls ?? []) as OpenAI.Chat.ChatCompletionMessageFunctionToolCall[];

    // 模型不再调用工具，输出最终答案
    if (finishReason === "stop" || toolCalls.length === 0) {
      console.log(`\n最终回答:\n${message.content}\n`);
      break;
    }

    // 执行所有工具调用，并将结果追加到历史
    console.log(`需要调用的工具: ${toolCalls.map((tc) => tc.function.name).join(", ")}\n`);
    for (const toolCall of toolCalls) {
      const toolName = toolCall.function.name;
      const toolArgs: Record<string, unknown> = JSON.parse(toolCall.function.arguments);
      console.log(`调用工具: ${toolName}，参数: ${JSON.stringify(toolArgs)}`);

      const toolResult = await executeTool(toolName, toolArgs);
      console.log(`工具结果: ${toolResult}\n`);

      messages.push({
        role: "tool",
        tool_call_id: toolCall.id,
        content: toolResult,
      });
    }
  }
}


await runAgent("查一下深圳今天天气怎么样？然后根据天气查询一下合适的旅游景点然后汇总推荐给我");
