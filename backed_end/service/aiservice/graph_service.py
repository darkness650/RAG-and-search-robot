from langchain_core.messages import HumanMessage
from langchain_openai import ChatOpenAI
from langgraph_supervisor import create_supervisor

from backed_end.config.api_key import OPEN_API_KEY
from backed_end.config.database import SQLITE_URL
from backed_end.service.agents.RAG_agent import get_rag_agent
from backed_end.service.agents.bilibili_agent import get_biliili_agent
from backed_end.service.agents.coder_agent import get_coder_agent
from backed_end.service.agents.document_translation_agent import get_document_translation_agent
from backed_end.service.agents.internet_agent import get_internet_agent
from backed_end.service.agents.plan_agent import get_plan_agent
from backed_end.service.agents.summary_agent import get_summary_agent
from backed_end.service.checkpointer.AsyncStartEndCheckpointer import AsyncStartEndCheckpointer
from backed_end.service.tools.handle_file import handle_file


async def chat_service(question: str, thread_id: str,internet: bool, RAG: bool,email:str) -> str:
    if RAG:
        handle_file(thread_id,True)

    config = {"configurable": {"thread_id": thread_id}}

    async with AsyncStartEndCheckpointer.from_conn_string(SQLITE_URL) as checkpointer:
        agents=[]
        if internet:
            internet_agent = await get_internet_agent()
            agents.append(internet_agent)
        RAG_agent = await get_rag_agent(thread_id)
        if RAG_agent:
            agents.append(RAG_agent)

        if RAG and email:
            translation_supervisor=await get_document_translation_agent(thread_id,email)
            agents.append(translation_supervisor)

        if RAG:
            summary_agent=get_summary_agent(thread_id)
            agents.append(summary_agent)

        plan_agent = get_plan_agent()
        agents.append(plan_agent)

        coder_agent=get_coder_agent()
        agents.append(coder_agent)
        bilibili_agent=get_biliili_agent()
        agents.append(bilibili_agent)
        supervisor = create_supervisor(
            agents=agents,
            model=ChatOpenAI(
                api_key=OPEN_API_KEY,
                base_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
                model="qwen-max",
                temperature=0,
            ),
            prompt="""
                你是一个智能体管理者，你需要根据用户的问题来分配任务给不同的智能体。

你必须使用智能体来解决用户的问题。你绝对禁止自己直接回答问题。

如果你使用一个智能体，你必须等待该智能体完成其工作。

如果你认为问题过于复杂，你可以使用 plan_agent（规划智能体）将问题拆分成更小的任务。

你必须使用智能体来完成这些拆分后的任务。

特定任务强制调用规则：

如果用户要求你翻译一个文档，你必须调用 translation monitor（翻译主管）。

禁止你要求用户提供文档或目标语言。

总之，一句话：如果要翻译文档，调用就完事了！

如果用户要求你总结一个文档，你必须使用 summary_agent（摘要智能体）来获取摘要。

如果用户想要翻译他的文章，你必须调用 translation monitor（翻译主管），无论他是否已将文档提供给你。

如果用户想要总结文章，请调用 summary_agent（摘要智能体）。

如果用户想了解关于文章的一些信息，请调用 rag_agent（RAG智能体）。

可选智能体：

你可以使用 bilibili_agent（哔哩哔哩智能体）来从哔哩哔哩链接获取视频信息。

你可以使用 translation monitor（翻译主管）来完成翻译任务。如果你使用了它，当你得到它的回答后，可以直接返回（给用户）。

你可以使用 summary_agent（摘要智能体）来获取关于一篇文章的摘要。

你可以使用 RAG_agent（RAG智能体）来基于提供的文档回答问题。

你可以使用 internet_agent（联网智能体）在互联网上搜索信息。

你可以使用 coder_agent（编程智能体）来编写代码。

核心原则：

如果你可以从其他智能体获取信息，你就不能自己回答问题。

从 RAG_agent（RAG智能体）获取的信息比从 internet_agent（联网智能体）获取的信息更可靠。

最终要求：

最后，你必须汇总答案，并将最终答案以中文返回给用户。

必须使用中文！
            """,
            include_agent_name='inline',
            output_mode="last_message",
            #state_schema=State,
            supervisor_name="monitor"
        ).compile(checkpointer=checkpointer)

        yield f"data: __chat_id__:{thread_id}\n\n"

        async for event in supervisor.astream_events(
                {
                    "messages": HumanMessage(content=question),
                },
                config=config,
                stream_mode="values"
        ):
            if event["event"] == "on_chat_model_stream" and event["metadata"]["ls_model_name"]=="qwen-max":# and event["data"]["chunk"].response_metadata["model_name"]=="qwen-plus":
                for chunk in event["data"]["chunk"].content:
                    yield f"data: {chunk}\n\n"


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
        asyncio.run(chat_service(question, thread_id,True, True,"873319973@qq.com"))
