import os
from typing import Dict, Any

from langchain import hub
from langchain.agents import create_react_agent, AgentExecutor
from langchain_core.messages import AIMessage, HumanMessage
from langchain_core.tools import Tool, create_retriever_tool
from langchain_openai import ChatOpenAI
from langgraph.checkpoint.sqlite import SqliteSaver
from langgraph.constants import START, END
from langgraph.graph import StateGraph

from backed_end.service.node.CustomToolNode import CustomToolNode
from backed_end.service.state.chat_manager import ChatMemoryManager
from backed_end.service.state.state import State
from backed_end.service.tools.fileRAG_tool import RAG_tool
from backed_end.service.tools.search_tool import reliable_duckduckgo_search


# 2. 修改 service 函数
def service(question: str, thread_id: str, internet: bool,RAG:bool) -> str:
    """
    主服务函数，用于处理用户输入并返回 AI 响应。
    :param question: 用户的问题
    :param thread_id: 标识用户，做会话隔离
    :param internet: 是否启用internet搜索
    :param RAG: 是否启用文档检索
    :return:
    """
    #配置检查点
    config = {"configurable": {"thread_id": thread_id}}
    db_path = r"../service/SQLite/checkpoints.sqlite"
    os.makedirs(os.path.dirname(db_path), exist_ok=True)
    #使用sqlite数据库做检查点
    with SqliteSaver.from_conn_string(db_path) as checkpointer:
        graph_builder = StateGraph(State)

        # 初始化 Memory 管理器
        memory_manager = ChatMemoryManager(
            max_history=10,
            summary_threshold=5
        )
        #根据是否启用internet搜索和RAG检索来配置工具
        tools=[]
        if internet:
            tools.append(
                Tool(
                    name="reliable_duckduckgo_search",
                    func=reliable_duckduckgo_search,
                    description="使用 DuckDuckGo 进行可靠的搜索，使用英文搜索更加准确"
                )
            )
        if RAG:
            retriever = RAG_tool(thread_id)
            tools.append(
                create_retriever_tool(
                    retriever=retriever,
                    name="文档检索",
                    description="用于检索用户提出的问题并基于检索到的文档内容进行回复",
                )
            )
        #初始化大模型
        llm = ChatOpenAI(
            api_key="sk-2005a529a0684314bb0a16516d9e14f2",
            base_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
            model="qwen-max",
            temperature=0.5
        )
        #拉取 React Agent 的提示模板
        prompt = hub.pull("hwchase17/react-chat")
        #对提示词做工具个性化改造
        prompt+=("你必须尽可能使用工具，如果你可以使用文档检索工具，请先调用文档检索工具查看是否有你需要的信息，如果你可以使用搜索引擎，请使用 DuckDuckGo 进行搜索，使用英文搜索更加准确。"
                 "如果可以调用文档检索则试图调用文档检索，若查询出结果，则不要使用搜索引擎工具，若未检索出内容，若可调用搜索引擎工具，则调用搜索引擎查询，若调用搜索引擎工具失败三次则停止调用搜索引擎，使用目前已知的信息回答")
        # 创建 React Agent
        agent = create_react_agent(
            tools=tools,
            llm=llm,
            prompt=prompt,
        )
        # 创建 AgentExecutor
        agent_executor = AgentExecutor(
            agent=agent,
            tools=tools,
            verbose=True,
            return_intermediate_steps=True,
            handle_parsing_errors=True,
        )

        # 创建chatbot节点
        def chatbot(state: State) -> Dict[str, Any]:
            # 压缩历史消息
            condensed_messages = memory_manager.condense_history(state["messages"], llm)

            # 构建消息内容（用于打印/调试）
            messages_content = memory_manager.build_messages_content(condensed_messages)
            print("Condensed messages content:\n", messages_content)

            # 准备 Agent 输入
            input_messages = [{"role": "user", "content": condensed_messages[-1].content}]

            # 执行 Agent
            response = agent_executor.invoke({
                "input": condensed_messages[-1].content,
                "chat_history": condensed_messages[:-1]
            })
            if(len(state["messages"])>5):
                return {"messages": [AIMessage(content="Answer:"+response["output"])]}
            # 返回 AI 响应
            return {"messages": [AIMessage(content=response["output"])]}
        tool_node = CustomToolNode(tools=tools)



        #条件边的条件
        def custom_condition(state: State):
            last_message = state["messages"][-1]
            if hasattr(last_message, "tool_calls") and last_message.tool_calls:
                return "tools"
            return "end"
        #创建图
        graph_builder.add_node("chatbot", chatbot)
        graph_builder.add_node("tools", tool_node)

        graph_builder.add_edge(START, "chatbot")
        graph_builder.add_edge("tools", "chatbot")

        graph_builder.add_conditional_edges(
            "chatbot",
            custom_condition,
            {"tools": "tools", "end": END}
        )

        graph = graph_builder.compile(
            checkpointer=checkpointer,
            interrupt_before=["tools"],
            interrupt_after=["tools"]
        )

        output = graph.invoke({"messages": [HumanMessage(content=question)]},
                              config=config,
                              stream_mode="values")
        return (output["messages"][-1].content)


