import os

from langchain_openai import ChatOpenAI
from langgraph.prebuilt import create_react_agent

from backed_end.config.api_key import OPEN_API_KEY
from backed_end.service.tools.summary_tool import get_summary_tool


def get_summary_agent(thread_id):
    llm = ChatOpenAI(
        api_key=OPEN_API_KEY,
        base_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
        model="qwen-plus",
        temperature=0
    )
    tools=[get_summary_tool]
    summary_agent=create_react_agent(
        model=llm,
        tools=tools,
        name="summary_agent",
        prompt=f"you are summary agent,you must pass the {thread_id} to the tool,then you can get summary and return it",
    )
    return summary_agent