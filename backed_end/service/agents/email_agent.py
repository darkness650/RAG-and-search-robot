import os

from langchain_openai import ChatOpenAI
from langgraph.prebuilt import create_react_agent

from backed_end.config.api_key import OPEN_API_KEY
from backed_end.service.tools.email_tools import sendemail


def get_email_agent(email:str,thread_id:str):
    llm = ChatOpenAI(
        api_key=OPEN_API_KEY,
        base_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
        model="qwen-plus",
        temperature=0
    )
    tools=[sendemail]
    office_agent=create_react_agent(
        model=llm,
        tools=tools,
        name="email_agent",
        prompt=f"you are email_agent,you must call the tools to send email to target mailbox,"
               "you mustn't return directly without calling tools"
               f"you need to pass email:{email} and thread_id:{thread_id} to the tool ",
    )
    return office_agent
if __name__ == '__main__':
    agent=get_email_agent()
    agent.invoke({"messages":"email邮箱是873319973@qq.com,thread_id是2"})