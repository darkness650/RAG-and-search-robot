import os

from langchain_openai import ChatOpenAI
from langgraph.prebuilt import create_react_agent

from backed_end.config.api_key import OPEN_API_KEY


def get_coder_agent():

    llm = ChatOpenAI(
        api_key=OPEN_API_KEY,
        base_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
        model="qwen-coder-turbo",
        temperature=0
    )
    coder_agent=create_react_agent(
        model=llm,
        tools=[],
        name="coder_agent",
        prompt="you are a code assistant,you are responsible to help user write code"
    )
    return coder_agent

if __name__ == '__main__':
    agent=get_coder_agent()
    output=agent.invoke({"messages":"用java帮我写一个用反射机制复制对象的代码"})
    print(output["messages"][-1].content)