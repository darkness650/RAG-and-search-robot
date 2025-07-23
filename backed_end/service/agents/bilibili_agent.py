import os

from langchain_core.tools import Tool
from langchain_openai import ChatOpenAI
from langgraph.prebuilt import create_react_agent

from backed_end.config.api_key import OPEN_API_KEY
from backed_end.service.tools.bilibili_tool import get_bilibili_tool


def get_biliili_agent():
    llm = ChatOpenAI(
        api_key=OPEN_API_KEY,
        base_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
        model="qwen-max",
        temperature=0
    )
    tools=[
        Tool(
            func=get_bilibili_tool,
            name="get_bilibili_tool",
            description="""
            get information from bilibili_url,you need pass a bilibili_url list to it
            example:
            bilibili_url
            """
        )
    ]
    bilibili_agent = create_react_agent(
        model=llm,
        tools=tools,
        name="bilibili_agent",
        prompt="你是一个bilibili视频总结助手，你必须调用get_bilibili_tool工具来获取视频信息，并且你只能调用这个工具。你禁止自己生成回答内容，你必须如实反馈工具返回的信息"
        "禁止不调用工具就返回信息",
    )
    return bilibili_agent

if __name__ == "__main__":
    agent=get_biliili_agent()
    output=agent.invoke({"messages":"BV1K4gNzqEHi 帮我总结一下这个视频都说了什么"})
    print(output["messages"][-1].content)