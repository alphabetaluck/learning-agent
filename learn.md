# 当前文档记录学习 agent 开发的相关内容，主要包括 agent 的核心流程、设计原则、常用算法等方面的知识。

# agent 核心流程

感知->决策->执行->反馈


# client.chat.completions.create 返回结果

{
  content: "Thought: 我将同时查询北京的当前天气，并在网上搜索“2025年最受欢迎的 AI 编程工具”。接下来同时调用天气和搜索工具获取信息。 Action: multi_tool_use.parallel(tool_uses=[{\"recipient_name\":\"functions.get_weather\",\"parameters\":{\"city\":\"Beijing\"}},{\"recipient_name\":\"functions.tavily_search\",\"parameters\":{\"query\":\"2025年最受欢迎的 AI 编程工具\",\"max_results\":6}}])",
  padding: "abcdefghijklmnopqrstuvwxyz0123456",
  role: "assistant",
  tool_calls: [
    {
      function: {
        arguments: "{\"city\":\"Beijing\"}",
        name: "get_weather",
      },
      id: "call_dGFa7RgB9lxdXCyHjpGUQZJR",
      type: "function",
    },
  ],
}


tool_calls 是 OpenAI SDK（或者说后端模型层）专门“自动处理”好的结构化结果，如果 OpenAI 不提供 tool_calls 字段，开发者需要自己写正则表达式或复杂的解析逻辑去处理