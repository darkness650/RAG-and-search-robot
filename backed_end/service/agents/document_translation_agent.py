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
    email_agent = get_email_agent()
    office_agent = get_office_agent()
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
                you are a supervisor that monitor three agents,please divide tasks to them and finish the task.
                you just divide tasks to agents,don't care any other problem,even if user gives incomplete information,agents can handle it
                if you get a task,please use office_agent to translate and get local office document,use email_agent to send email whether the user ask you to send email or not
                thread_id:{thread_id}         target_email:{target_email}
                when you send the thread_id to agents,just name it "thread_id",no other extra things
                when you ask agents to finish job,please give them thread_id
                the office_agent can translate the document to target language and output the translation content to office document,you must pass it the thread_id 
                after the work of office_agent,you must call email_agent to send the document to user
                the email_agent can send the document to target mailbox,you should tell it what is the target mailbox and thread_id
                after send the email,please call the handle_file_agent to handle the translation file
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