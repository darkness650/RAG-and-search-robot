# RAG-and-search-robot

一个集成「多智能体（Agents）编排、RAG 文档检索增强、联网搜索与浏览、媒体生成（图/视频）、哔哩哔哩视频信息提取、文档翻译与写作、代码助手」的全栈示例项目。  
后端使用 FastAPI + LangChain/LangGraph + Neo4j（向量索引）+ MySQL（业务数据）+ Redis（会话/验证码）实现，前端使用 React + Vite 构建对话与文件管理界面，支持流式输出与会话管理（新建、重命名、收藏、删除）。

技术栈占比（基于仓库统计）：JavaScript 46.8% · Python 32.7% · CSS 17.4% · HTML 1.6% · SCSS 1.3% · TypeScript 0.2%

---

## 功能总览

- 多智能体编排（LangGraph）
  - 智能体总控（根据问题自动路由到合适的子智能体）
  - 任务规划智能体（将复杂问题拆解为子任务）
- RAG 检索增强
  - 支持上传 txt/docx/pdf/html 文档，向量化入库（Neo4j Vector），基于问题检索并生成回答
  - 会话级索引命名与隔离（thread_id 维度）
- 联网搜索与浏览
  - 使用 Tavily/Search 引擎检索关键信息，必要时使用浏览器工具访问链接抓取细节
- 多模态与内容生成
  - 文生图工具（返回图片 URL）
  - 文生视频工具（返回视频 URL）
- 媒体与第三方信息获取
  - 哔哩哔哩链接信息抓取与总结
- 文档工作流
  - 文档翻译工具（多语言）
  - 将翻译/结果输出到本地文档（OfficeWriterTool）
  - 文档摘要工具（基于会话资料生成概要）
- 代码智能体
  - 面向编程问题与代码片段生成的助手
- 会话与权限
  - OAuth2 密码登录 + 邮箱验证码登录/注册
  - 基于 Redis 的会话校验与登录态失效检测
  - 会话列表：查询、重命名、收藏、删除
  - CORS 已启用（开发态）

---

## 架构与目录

- 后端（FastAPI）
  - 配置层：`backed_end/config/`
    - 应用入口与中间件：`app.py`
    - 启动脚本：`run.py`（Uvicorn）
    - 数据库与 Redis：`database.py`（MySQL + Redis + SQLite Checkpointer）
    - 安全与鉴权：`security.py` `token_manage.py` `user_mannage.py` `psw_manage.py`
    - 常量配置：`config.py`（SECRET_KEY、算法、HuggingFace 模型路径等）
  - 控制器：`backed_end/controller/`
    - AI 对话与多模态：`ai_controller.py`
    - 用户：`User.py`
    - 登录/令牌：`token.py`
    - 注册：`sign_up.py`
    - 会话列表：`chat_list.py`
  - 业务模型：`backed_end/pojo/`（User、ChatList、Token 等）
  - 服务：
    - 智能体服务：`service/agents/`
      - 任务规划：`plan_agent.py`
      - RAG 智能体：`RAG_agent.py`（基于 Neo4j 向量索引）
      - 互联网智能体：`internet_agent.py`（搜索 + 浏览）
      - 摘要智能体：`summary_agent.py`
      - 文档处理智能体：`handle_file_agent.py`
      - 办公/翻译智能体：`office_agent.py`
      - 图片生成：`generate_picture_agent.py`
      - B 站视频信息：`bilibili_agent.py`
      - 代码助手：`coder_agent.py`
    - AI 流程编排：`service/aiservice/`
      - 智能体图编排与分流：`graph_service.py`
      - 通用 Agent 执行：`aiservice.py`（搜索/RAG 的工具选择与提示词策略）
      - 多模态与内容生成：`generate_service.py`
    - 工具：`service/tools/`
      - RAG 向量检索封装：`fileRAG_tool.py`（Neo4jVector + m3e-base Embedding）
      - 文档加载/入库：`handle_file.py`
      - 搜索工具、浏览器工具、翻译、Office 写入、B 站视频抓取、图片/视频生成等
- 前端（React + Vite）
  - 项目：`front_end/vite-project/`
    - 路由与入口：`src/App.jsx`、`src/main.jsx`
    - 典型页面组件：
      - 对话页（流式输出、头像、富文本）：`src/pages/IOT/component/demotwo.jsx`
      - 文档学习/上传页：`src/pages/IOT/component/preReleaseComponents/documentlearn.jsx`
      - 视频总结页：`src/pages/IOT/component/preReleaseComponents/videosummary.jsx`
      - 会话/环境管理与文件拖拽上传：`src/pages/environmentManage.jsx`
    - 构建与开发配置：`vite.config.js`（dev 端口 5173，代理与别名等）

---

## 关键能力与实现细节

### 1) 智能体编排（总控与子智能体）
- 智能体总控（graph_service.py）
  - 根据用户意图，选择合适的智能体执行。
  - 规则示例：
    - 总结问题 → 调用 summary_agent
    - 基于资料问答 → 调用 RAG_agent
    - 涉及 B 站链接 → 调用 bilibili_agent
    - 需要翻译/文档输出 → 调用 office_agent
    - 复杂问题 → 先用 plan_agent 规划子任务再逐一执行
  - 明确约束：总控自身禁止直接作答，必须等待子智能体返回。
- 提示词策略（aiservice.py）
  - 优先文档检索（如可用），检索失败再走互联网搜索。
  - 搜到 URL 但无具体内容时，强制使用浏览工具访问抓取详情。
  - 搜索失败达到阈值则停止，基于已知信息作答。

### 2) RAG 文档检索增强
- 文档加载（handle_file.py）
  - 支持 txt/docx/pdf/html 等格式，读取并清洗。
- 向量化与存储（fileRAG_tool.py）
  - 使用 HuggingFace m3e-base（本地路径配置）进行向量化。
  - Neo4j Vector 索引：每个会话使用独立的索引名和节点标签（doc_index_{thread_id} / Document_{thread_id}）。
  - 在检索时检查索引是否存在，若不存在直接返回 None，避免报错。
- 智能体封装（RAG_agent.py）
  - 将检索器包装为可调用工具，强制「先检索后回答」，禁止无依据作答。

### 3) 联网搜索与浏览
- 搜索引擎工具（Tavily / DuckDuckGo 封装）
- 浏览器访问工具（打开链接提取正文、细节）
- 约束：拿到 URL 必须进入浏览工具获取具体内容再汇总给用户。

### 4) 多模态生成与媒体信息
- 文生图与文生视频工具（generate_service.py / generate_picture_agent.py）
  - 强制通过工具获取 URL，不允许模型「凭空返回」。
- B 站信息智能体（bilibili_agent.py）
  - 传入链接列表，工具抓取并「如实返回」信息，禁止自作总结与编造。

### 5) 文档翻译与写作
- 翻译工具 + Office 写入（office_agent.py）
  - 提示词强制流程：必须先翻译再写入文档，完成后方可返回。

### 6) 会话与权限体系
- 登录方式：
  - 密码登录：`/token`（OAuth2 密码模式）
  - 邮箱验证码登录：`/token/send_login_code` + `/token/login_by_code`
- 注册方式：
  - 普通注册：`/sign_up/`
  - 验证码注册：`/sign_up/send_verification_code` + `/sign_up/by_code`
- 登录态校验：
  - 令牌中携带 session_id，后端在 Redis 校验是否与服务端记录一致，防止并发异地或过期令牌继续使用。
- 会话列表：
  - 获取列表：`GET /chat_list/{role}`
  - 重命名：`PATCH /chat_list/rename`
  - 收藏：`PATCH /chat_list/star`
  - 删除：`POST /chat_list/delete`

### 7) 流式输出
- 后端使用 StreamingResponse 持续推送文本分片。
- 前端使用 `fetch` + `ReadableStream.getReader()` 增量解码显示，体验接近实时对话。

---

## API 速览

所有受保护路由需在 Header 中携带 `Authorization: Bearer <access_token>`。

- 登录与注册
  - POST `/token`  
    表单：`username`, `password`  
    返回：`{ "access_token": "...","token_type":"bearer" }`
  - POST `/token/send_login_code?email=xxx`
  - POST `/token/login_by_code`  
    JSON：`{ "email": "...", "code": "123456" }`
  - POST `/sign_up/`（注册）
  - POST `/sign_up/send_verification_code?email=xxx`
  - POST `/sign_up/by_code`（验证码注册）
- 用户（仅管理员）
  - GET `/users/`（列表）
  - GET `/users/{user_id}`（详情）
  - POST `/users/`（创建）
  - DELETE `/users/{user_id}`（删除）
- 会话列表
  - GET `/chat_list/{role}`
  - PATCH `/chat_list/rename`（Body: `{chat_id,new_name}`）
  - PATCH `/chat_list/star`（Body: `{chat_id,starred}`）
  - POST `/chat_list/delete`（Body: `{chat_id}`）
- AI 对话与生成
  - POST `/ai/chat/{model}`（流式）
    - 表单字段：
      - `question`: string（必填）
      - `web_search`: boolean（可选，默认 false）
      - `files`: File[]（可选，多文件）
      - `chat_id`: string（可选，不传则后端创建并在响应头返回 `X-Chat-Id`）
    - `model` 示例：
      - `chat`：由智能体总控分发（RAG/搜索/翻译/摘要/B站等）
      - `qwen-max`：直连指定大模型通道（示例前端中有使用）
      - 其他角色化路径（如存在）：`/ai/chat/role/{roleName}`

说明：部分路由名在前端组件中有例子，具体以后端控制器实现为准。

---

## 前端使用

- 项目位置：`front_end/vite-project/`
- 开发启动：
  - Node.js ≥ 18
  - 安装依赖并启动
    ```bash
    cd front_end/vite-project
    npm install
    npm run dev
    ```
  - 默认运行在 `http://localhost:5173`
- 主要页面
  - 对话页：流式对话、头像/气泡 UI、历史列表拉取、支持传入 `chat_id` 继续上下文
  - 文档学习：上传文件后提问（RAG）
  - 视频总结：上传视频文件或文本，调用后端流式总结
  - 环境管理：拖拽上传、多文件处理、状态动画

---

## 后端部署与运行

### 依赖与外部服务
- Python ≥ 3.10
- MySQL（示例默认：`mysql+aiomysql://myuser:12345678@localhost:3306/dbabc`）
- Redis（默认 `localhost:6379`）
- Neo4j（用于向量索引）
- HuggingFace Embedding 模型（本地路径，默认 `../service/models/m3e-base-huggingface`）
- 阿里云百炼（DashScope）API Key（Qwen 系列模型）
- 可选：邮件服务（用于发送登录/注册验证码���

### 安装与配置
1) 安装依赖（建议创建虚拟环境）
   ```bash
   pip install -U fastapi uvicorn sqlmodel aiomysql redis "passlib[bcrypt]" python-jose[cryptography] \
     langchain langgraph langchain-openai langchain-community langchain-tavily \
     neo4j huggingface-hub sentence-transformers pypdf python-docx unstructured
   ```
   注：依赖版本可根据实际需要调整；项目若提供 `requirements.txt`，以其为准。

2) 配置环境变量或配置文件（示例）
   ```bash
   # 大模型与工具
   export OPEN_API_KEY="your_dashscope_key"
   export TAVILY_API="your_tavily_key"

   # Neo4j
   export NEO4J_URL="bolt://localhost:7687"
   export NEO4J_SECRET="your_neo4j_password"

   # MySQL / Redis
   export DATABASE_URL="mysql+aiomysql://myuser:12345678@localhost:3306/dbabc"
   export REDIS_HOST="localhost"
   export REDIS_PORT="6379"

   # 安全
   export SECRET_KEY="override_in_production"
   export ALGORITHM="HS256"

   # 本地 Embedding 模型路径
   export HUGGINGFACE_URL="../service/models/m3e-base-huggingface"
   ```

3) 初始化数据库与运行服务
   - 推荐使用 Uvicorn 直接运行模块路径（更稳健）：
     ```bash
     uvicorn backed_end.config.app:app --host 0.0.0.0 --port 8080 --reload
     ```
   - 或使用提供的启动脚本：
     ```bash
     cd backed_end/config
     python run.py
     ```
   - 服务启动后默认地址：`http://localhost:8080`

### 首次体验建议流程
1) 注册账号（或使用验证码注册），登录获取 `access_token`。  
2) 前端登录页或将 `access_token` 写入浏览器 `localStorage`/`sessionStorage`（键名示例：`auth_token`）。  
3) 进入对话页面：直接提问或上传文档后与智能体对话。  
4) 在会话列表中查看/重命名/收藏/删除历史对话。

---

## RAG 使用指引与注意事项

- 每个会话（`chat_id` 或 `thread_id`）拥有独立的向量索引命名空间（`doc_index_{thread_id}`，节点标签 `Document_{thread_id}`）。
- 上传文档后，文档会被加载与向量化，并入库至 Neo4j 向量索引；若索引不存在，检索工具会返回空以避免报错。
- 在对话中问与上传资料相关的问题，系统会优先尝试检索并基于命中文档进行回答；若无命中再考虑联网搜索。

---

## 安全与生产化建议

- 将 `SECRET_KEY`、数据库口令、DashScope/Tavily/Neo4j 凭据通过安全方式注入，不要硬编码在仓库中。
- CORS 在开发环境默认放开为 `*`，生产建议收敛到可信域名。
- 为 Redis/MySQL/Neo4j 配置强密码与网络访问控制。
- 令牌带有 `session_id` 校验，服务端可随时使客户端旧会话失效；前端需做好 401 处理与重登。

---


## 开源协议

本项目仅用于学习与研究。若要用于生产，请完善安全与配置项，并依据所使用第三方服务与模型的协议进行合规使用。

---

## 致谢

- FastAPI / SQLModel / Redis / Neo4j
- LangChain / LangGraph / HuggingFace
- 阿里云百炼（DashScope）Qwen 系列模型
- Tavily/Search 等搜索生态
