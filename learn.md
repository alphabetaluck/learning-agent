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


# 例子：

用户提示词: 查一下深圳今天天气怎么样？然后根据天气查询一下合适的旅游景点然后汇总推荐给我

── 第 1 轮 ───

需要调用的工具: get_weather

调用工具: get_weather，参数: {"city":"Shenzhen"}

工具结果: {"city":"Shenzhen","temperature":"29°C / 85°F","feelsLike":"33°C","humidity":"70%","description":"Patchy rain nearby","wind":"16 km/h S","visibility":"10 km","uvIndex":"6"}


─── 第 2 轮 ───

需要调用的工具: get_attraction

调用工具: get_attraction，参数: {"city":"Shenzhen","weather":"雨天"}

工具结果: {"answer":"在深圳下雨天，推荐去COCO PARK或罗湖商业城购物，或者深圳博物馆参观。","results":[{"title":"深圳10 大最佳雨天室內景點活動 - Tripadvisor","url":"https://www.tripadvisor.com.hk/Attractions-g297415-Activities-zft11295-Shenzhen_Guangdong.html","content":"深圳最佳雨天活動 · 1. COCO PARK · 2. 羅湖商業城 · 3. 深圳博物館 · 4. 深圳華潤萬象城 · 5. 深圳會展中心 · 6. 京基100 · 7. 深圳圖書館 · 8. 深圳機場商業街."},{"title":"深圳雨天好去處 - Trip.com","url":"https://hk.trip.com/moments/detail/shenzhen-26-125230687/","content":"一本書,一杯咖啡,一個角落,大概只有i人才懂的快樂吧~趁著下雨天🌧️,來這裡窩上一天,還挺愜意的。 :溪木素年書屋 :2(8)號線蛇口港C出口"},{"title":"深圳下雨天适合去哪里玩？ - 网易","url":"https://www.163.com/dy/article/J82BVCCP0525CKB5.html","content":"深圳野生动物园坐落于美丽的西丽湖畔，有着得天独厚的自然环境，是亲子研学的好去处，这里可以有机会投喂长颈鹿、斑马、老虎等，还能看到全民偶像“大熊猫”，全"},{"title":"深圳市10 大城市游览 - Tripadvisor","url":"https://cn.tripadvisor.com/Attractions-g297415-Activities-c42-t224-Shenzhen_Guangdong.html","content":"探索热门景点，如陈氏宗祠、五羊铜像、千年榕树庙、沙面岛，以及世界一流的现代建筑，如广州塔、歌剧院、广东省博物馆、广州图书馆等。灵活的行程安排可满足你自己的喜好。 在"},{"title":"深圳市10 大景点玩乐 - Tripadvisor","url":"https://cn.tripadvisor.com/Attractions-g297415-Activities-Shenzhen_Guangdong.html","content":"深圳市的热门景点. 了解推荐的选择方式 · 1. 锦绣中华·民俗村 · 4.2. (1,270). 历史景点 · 2. 深圳世界之窗 · 4.0. (2,396) · 3. COCO PARK · 4.2. (391) · 4. 罗湖商业城."}]}


─── 第 3 轮 ───
最终回答:


Thought: 我已查询到深圳当前天气并根据“有阵雨”的情况准备给出适合的雨天的景点推荐与简短出行建议。

Action: Finish: [当前天气（深圳）：气温 29°C，体感约 33°C，湿度 70%，有阵雨，风速约 16 km/h。建议以室内或近距离活动为主。推荐（按类型与优先级）：
1）文化参观：深圳博物馆 —— 室内、适合避雨和了解城市历史。
2）购物美食：COCO PARK、罗湖商业城、华润万象城 —— 商场集中，餐饮、影院、咖啡馆可消磨雨天时光。
3）休闲观景/安静场所：京基100（观景/商场）、深圳图书馆 —— 适合短憩或观景（雨天视野可能受限）。
注意事项：带好雨具或轻薄防雨外套、穿透气衣物并补水；若想去户外（如野生动物园）建议改期或选雨间短时前往。需要我帮你按地理位置安排一日行程或查询某个景点的营业/交通信息吗？]