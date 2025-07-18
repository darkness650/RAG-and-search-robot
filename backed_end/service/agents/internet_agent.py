import os

from langchain import hub

from langchain_core.tools import Tool
from langchain_openai import ChatOpenAI
from langchain_tavily import TavilySearch
from langgraph.prebuilt import create_react_agent

from backed_end.config.api_key import OPEN_API_KEY
from backed_end.service.tools.internet_tool import get_browser_tools
from backed_end.service.tools.search_tool import reliable_duckduckgo_search


async def get_internet_agent():
    """
    获取一个配置好的互联网代理助手。
    :return: 一个包含互联网代理助手配置的字典
    """
    llm = ChatOpenAI(
        api_key=OPEN_API_KEY,
        base_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
        model="qwen-max",
        temperature=0
    )
    tools= []  # 这里可以添加具体的工具列表
    tools.append(Tool(func=reliable_duckduckgo_search,
                        name="reliable_duckduckgo_search",
                      description="使用 DuckDuckGo 进行可靠的搜索"
                ))
    #tools.append(TavilySearch(tavily_api_key="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",max_results=10))
    internet_tool= await get_browser_tools()
    tools.extend(internet_tool)
    internet_agent = create_react_agent(
        model=llm,
        prompt= "you are a helpful assistant that can search the internet and use browser tools to find information."
                "you can use reliable_duckduckgo_search to search the internet and use browser tools to find information."
                "if you get a url from reliable_duckduckgo_search, you must use browser tools to visit the url and get the specific information.",
        tools=tools,
        name="internet_agent",
    )

    return internet_agent
