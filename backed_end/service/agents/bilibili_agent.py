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
        model="qwen-plus",
        temperature=0
    )
    tools=[
        Tool(
            func=get_bilibili_tool,
            name="get_bilibili_tool",
            description="""
            get information from bilibili_url,you need pass a bilibili_url list to it
            example:
            {
                "url":bilibili_url
            }
            """
        )
    ]
    bilibili_agent = create_react_agent(
        model=llm,
        tools=tools,
        name="bilibili_agent",
        prompt="you are bilibili agent, you can help user to get information from bilibili video",
    )
    return bilibili_agent

if __name__ == "__main__":
    agent=get_biliili_agent()
    output=agent.invoke({"messages":"BV1K4gNzqEHi 帮我总结一下这个视频都说了什么"})
    print(output["messages"][-1].content)