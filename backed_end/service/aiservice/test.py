# 首先安装必要的库
# pip install langgraph-supervisor langchain-openai
import os

from langchain_openai import ChatOpenAI
from langgraph_supervisor import create_supervisor

from backed_end.config.database import SQLITE_URL
from backed_end.service.agents.RAG_agent import get_rag_agent
from backed_end.service.agents.internet_agent import get_internet_agent
from backed_end.service.aiservice.history_message import show_history_message
from backed_end.service.checkpointer.AsyncStartEndCheckpointer import AsyncStartEndCheckpointer



async def main(question:str):

    async with AsyncStartEndCheckpointer.from_conn_string(SQLITE_URL) as checkpointer:
        llm = ChatOpenAI(
            api_key=os.getenv("OPEN_API_KEY"),
            base_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
            model="qwen-plus",
            temperature=0
        )
        RAG_assistant = await get_rag_agent("1")
        # plan_agent = get_plan_agent()
        internet_assistant = await get_internet_agent()

        supervisor = create_supervisor(
            agents=[RAG_assistant, internet_assistant],
            model=llm,
            prompt=(
                "你管理着一个网络查询助手,一个文档搜索助手。文档搜索助手给出的信息比网络查询助手的更可信，请根据用户需求分配工作，除非两个助手都无法搜索到你需要的消息，否则你不许回答用户的问题,如果助手找到了你需要的消息，请将它们输出出来"
            ),
            include_agent_name='inline',
            output_mode="last_message",
        ).compile(checkpointer=checkpointer)

        # 测试多智能体系统
        print("用户请求:", question)
        output = await supervisor.ainvoke(
            {
                "messages": [
                    {
                        "role": "user",
                        "content": question
                    }
                ]

            },
            config={"configurable": {"thread_id": "1"}},
            stream_mode="values"
        )
        print(output["messages"][-1].content)  # 打印最新的消息内容


if __name__ == "__main__":
    import asyncio
    # question=input("请输入问题：")
    # asyncio.run(main(question))
    asyncio.run(show_history_message("1"))