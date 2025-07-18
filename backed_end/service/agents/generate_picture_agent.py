import os

from langchain_core.tools import Tool
from langchain_openai import ChatOpenAI
from langgraph.prebuilt import create_react_agent

from backed_end.config.api_key import OPEN_API_KEY
from backed_end.service.tools.generate_picture_tool import get_picture


def get_generate_picture_agent():
    llm = ChatOpenAI(
        api_key=OPEN_API_KEY,
        base_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
        model="qwen-turbo",
        temperature=0
    )
    tools=[Tool(
        func=get_picture,
        name="generate_picture_tool",
        description="生成图片用的工具，传入要生成什么样的图片，返回一个url"
    )]
    generate_picture_agent=create_react_agent(
        model=llm,
        tools=tools,
        name="generate_picture_agent",
        prompt="你是一个文生图助手，调用工具将用户给的图片描述传给工具后得到一个url"
    )
    return generate_picture_agent

if __name__ == '__main__':
    agent=get_generate_picture_agent()
    output=agent.invoke({"messages":"帮我生成一张可爱的狐狸兽人图片,在阳光下开心地自由奔跑"})
    print(output["messages"][-1].content)