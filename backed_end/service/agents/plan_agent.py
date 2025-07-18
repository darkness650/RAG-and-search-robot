import os

from langchain_openai import ChatOpenAI
from langgraph.prebuilt import create_react_agent

from backed_end.config.api_key import OPEN_API_KEY


def get_plan_agent():
    llm= ChatOpenAI(
        api_key=OPEN_API_KEY,
        base_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
        model="qwen-plus",
        temperature=0
    )
    plan_agent=create_react_agent(
        model=llm,
        prompt="you are a helpful assistant that can plan tasks and divide them into subtasks. "
               "in the system,there are many agents that can help you complete tasks,{agents}"
               "you can only divide tasks into subtasks,you cannot complete tasks by yourself",
        tools=[],
        name="plan_agent",
    )
    return plan_agent