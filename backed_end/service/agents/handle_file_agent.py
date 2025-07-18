import os

from langchain_core.tools import Tool
from langchain_openai import ChatOpenAI
from langgraph.prebuilt import create_react_agent

from backed_end.config.api_key import OPEN_API_KEY
from backed_end.service.tools.handle_file import handle_file


def get_handlefile_agent(thread_id):
    llm = ChatOpenAI(
        api_key=OPEN_API_KEY,
        base_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
        model="qwen-plus",
        temperature=0
    )
    tools = [Tool(
        func=handle_file,
        name="handle_file",
        description="""
            handle_file,需要thread_id
            示例：
            {
                "thread_id":thread_id
            }
        """
    )]
    handle_file_agent = create_react_agent(
        model=llm,
        tools=tools,
        name="handle_file_agent",
        prompt=f"you are handle_file agent,you mustn't return to monitor before you call the tool,you must call the tool.you must use the tool store document in database,when you call the tool,please pass it {thread_id}",
    )
    return handle_file_agent

if __name__ == "__main__":
    agent=get_handlefile_agent("2")
    agent.invoke({"messages":"thread_id为2"})