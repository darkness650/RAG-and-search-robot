from langchain_core.messages import HumanMessage
from langchain_openai import ChatOpenAI
from langgraph.constants import END
from langgraph_supervisor import create_supervisor

from backed_end.config.database import SQLITE_URL
from backed_end.service.agents.RAG_agent import get_rag_agent
from backed_end.service.agents.internet_agent import get_internet_agent
from backed_end.service.agents.plan_agent import get_plan_agent
from backed_end.service.checkpointer.AsyncStartEndCheckpointer import AsyncStartEndCheckpointer
from backed_end.service.state.state import State
from backed_end.service.tools.handle_file import handle_file


async def service(question: str, thread_id: str, model:str,internet: bool, RAG: bool) -> str:
    if RAG:
        handle_file(thread_id)

    config = {"configurable": {"thread_id": thread_id}}

    async with AsyncStartEndCheckpointer.from_conn_string(SQLITE_URL) as checkpointer:
        agents=[]
        RAG_agent = await get_rag_agent(thread_id)
        if RAG_agent:
            agents.append(RAG_agent)
        if internet:
            internet_agent = await get_internet_agent()
            agents.append(internet_agent)
        plan_agent = get_plan_agent()
        agents.append(plan_agent)
        supervisor = create_supervisor(
            agents=agents,
            model=ChatOpenAI(
                api_key="sk-2005a529a0684314bb0a16516d9e14f2",
                base_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
                model=model,
                temperature=0.5,
                streaming=True
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
            # state_schema=State
        ).compile(checkpointer=checkpointer)
        async for event in supervisor.astream_events(
                {
                    "messages": HumanMessage(content=question),
                },
                config=config,
                stream_mode="values"
        ):
            if event["event"] == "on_chat_model_stream" and event["metadata"]["ls_model_name"]==model:# and event["data"]["chunk"].response_metadata["model_name"]=="qwen-plus":
                for chunk in event["data"]["chunk"].content:
                    yield f"data: {chunk}\n\n"
                    # print(chunk,end="",flush=True)

        #     elif event["event"] == "on_tool_start":
        #         tool_name = event["name"]
        #         print(f"🔧 调用工具: {tool_name}")
        #
        # output = await supervisor.ainvoke(
        #     {
        #         "messages": [
        #             {
        #                 "role": "user",
        #                 "content": question
        #             }
        #         ]
        #
        #     },
        #     config=config,
        #     stream_mode="values"
        # )
        # return (output["messages"][-1].content)  # 打印最新的消息内容
        # await stream_response(question, supervisor,config)




if __name__ == "__main__":
    import asyncio

    while True:
        question = input("请输入问题：")
        if question.lower() == "exit":
            break
        thread_id = "1"
        asyncio.run(service(question, thread_id, "qwen-max",True, False))
