import os

from IPython.core.display import Image
from IPython.core.display_functions import display
from langchain_core.messages import HumanMessage
from langchain_openai import ChatOpenAI
from langgraph.checkpoint.sqlite.aio import AsyncSqliteSaver
from langgraph.constants import END
from langgraph_supervisor import create_supervisor

from backed_end.config.database import SQLITE_URL
from backed_end.service.agents.RAG_agent import get_rag_agent
from backed_end.service.agents.internet_agent import get_internet_agent
from backed_end.service.agents.plan_agent import get_plan_agent
from backed_end.service.checkpointer.AsyncStartEndCheckpointer import AsyncStartEndCheckpointer
from backed_end.service.state.state import State

from backed_end.service.tools.handle_file import handle_file


async def service(question: str, thread_id: str, internet: bool,RAG:bool) -> str:
    if RAG:
        handle_file(thread_id)

    config = {"configurable": {"thread_id": thread_id}}

    async with AsyncStartEndCheckpointer.from_conn_string(SQLITE_URL) as checkpointer:
        RAG_agent = await get_rag_agent(thread_id)
        internet_agent = await get_internet_agent()
        plan_agent = get_plan_agent()
        supervisor = create_supervisor(
            agents=[RAG_agent, internet_agent, plan_agent],
            model=ChatOpenAI(
                api_key=os.getenv("OPEN_API_KEY"),
                base_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
                model="qwen-plus",
                temperature=0,
            ),
            prompt="""
                你是一个智能体管理者，你需要根据用户的问题来分配任务给不同的智能体。
                you must try to use agent to solve user's question.Don't answer the question by yourself.
                if you use an agent,you must wait for the agent to finish its work.
                if you think the question is too complex,you can use the plan_agent to divide the question into smaller tasks.
                you must use agents to complete these tasks.
                you can use the RAG_agent to answer questions based on the provided documents.
                you can use the internet_agent to search the internet for information.
                you can't answer the question by yourself if you can get information from other agents.
                the information you get from the RAG agent is more reliable than the information you get from the internet agent.
                at last,you must conclude the answer and return the final answer to the user in Chinese.
                must in Chinese!
            """,
            include_agent_name='inline',
            output_mode="last_message",
            state_schema=State
        ).compile(checkpointer=checkpointer)
        # async for event in supervisor.astream_events(
        #         {
        #             "messages": HumanMessage(content=question),
        #         },
        #         config=config,
        #         stream_mode="values"
        # ):
        #     if event["event"] == "on_chat_model_stream" and event["metadata"]["ls_model_name"]=="qwen-plus":# and event["data"]["chunk"].response_metadata["model_name"]=="qwen-plus":
        #         for chunk in event["data"]["chunk"].content:
        #             print(chunk,end="",flush=True)
        #
        #     elif event["event"] == "on_tool_start":
        #         tool_name = event["name"]
        #         print(f"🔧 调用工具: {tool_name}")

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
        # await stream_response(question, supervisor,config)

async def stream_response(input: str,supervisor,config):
    inputs = {"messages": [HumanMessage(content=input)]}

    async for event in supervisor.astream_events(
            inputs,
            config=config,
            stream_mode="values"  # 或 "updates" 更细粒度
    ):
        event_type = event["event"]

        # 1. 监听最终输出
        if event_type == "on_chain_end" and event["name"] == END:
            final_output = event["data"]["output"]
            print( f"最终结果: {final_output}")

        # 2. 监听模型输出流
        elif event_type == "on_chat_model_stream":
            for chunk in event["data"]["chunk"].content:
                print(chunk)

        # 3. 监听工具调用
        elif event_type == "on_tool_start":
            tool_name = event["name"]
            print( f"🔧 调用工具: {tool_name}")

        # 4. 处理错误
        elif event_type == "on_error":
            print( f"⚠️ 错误: {event['data']['error']}")

if __name__ == "__main__":
    import asyncio
    while True:
        question = input("请输入问题：")
        if question.lower() == "exit":
            break
        thread_id = "1"
        asyncio.run(service(question, thread_id,True,False))