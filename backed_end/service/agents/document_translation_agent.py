import asyncio
import os

from langchain_openai import ChatOpenAI
from langgraph_supervisor import create_supervisor

from backed_end.config.api_key import OPEN_API_KEY
from backed_end.service.agents.email_agent import get_email_agent
from backed_end.service.agents.handle_file_agent import get_handlefile_agent
from backed_end.service.agents.office_agent import get_office_agent
from backed_end.service.tools.handle_file import handle_file


async def get_document_translation_agent(thread_id:str,target_email:str):
    email_agent = get_email_agent(target_email,thread_id)
    office_agent = get_office_agent(thread_id)
 #   translation_agent = get_translation_agent(thread_id)
    handle_file_agent=get_handlefile_agent(thread_id)
    supervisor = create_supervisor(
        agents=[email_agent, office_agent,handle_file_agent],
        model=ChatOpenAI(
            api_key=OPEN_API_KEY,
            base_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
            model="qwen-max",
            temperature=0,
        ),
        include_agent_name='inline',
        output_mode="last_message",
        # state_schema=State,
        supervisor_name="translation_monitor",
        prompt=f"""
你是一个监控主管，负责监督三个智能体。你必须将任务分配给它们以完成工作。

核心规则：

强制调用流程：

如果上级监控（monitor）给你分配任务（尤其是翻译任务），你绝对禁止要求用户提供文档或目标语言。你绝对禁止在没调用agent的时候就返回，你绝对禁止在未完成下面的流程的时候就返回

你必须调用 translation agent（翻译智能体）来翻译文档。

翻译完成后，你必须调用 office agent（办公文档智能体），将翻译智能体的输出写入办公文档（如 Word 等）。

文档生成后，你必须调用 email agent（邮件智能体） 发送邮件（无论用户是否明确要求发送邮件）。

邮件发送后，你必须调用 handle_file_agent（文件处理智能体） 来处理翻译生成的文件。

必须使用智能体：

你必须调用智能体来完成任务。

绝对禁止不调用智能体就直接返回结果。

专注任务分配：

你只负责将任务分配给智能体。

无需关心其他任何问题（如用户信息是否完整），智能体有能力自行处理。

任务处理通用要求：

当你收到一个任务时：

使用 office_agent（办公文档智能体）进行翻译并生成本地办公文档。

使用 email_agent（邮件智能体）发送邮件（无论用户是否要求）。

关键参数：

thread_id: {thread_id} (线程ID：{thread_id})

target_email: {target_email} (目标邮箱：{target_email})

office_agent 要求：

该智能体能将文档翻译成目标语言，并将翻译内容输出到办公文档。

你必须将 thread_id 传递给它。

email_agent 要求：

该智能体能将文档发送到目标邮箱。

你必须告诉它目标邮箱是什么以及thread_id。

最终步骤：

在 email_agent 发送邮件之后，必须调用 handle_file_agent（文件处理智能体） 来处理翻译生成的文件。
                """
    ).compile(name="translation_monitor")
    return supervisor

async def main():
    supervisor=await get_document_translation_agent("2","873319973@qq.com")
    output =  await supervisor.ainvoke(
        {
            "messages": [
                {
                    "role": "user",
                    "content": "请帮我翻译文章"
                }
            ]

        },
        stream_mode="values"
    )
    print(output["messages"][-1].content)  # 打印最新的消息内容

if __name__ == "__main__":
    asyncio.run(main())