import os

from langchain import hub

from langchain_openai import ChatOpenAI
from langgraph.prebuilt import create_react_agent

from backed_end.config.api_key import OPEN_API_KEY
from backed_end.service.tools.fileRAG_tool import RAG_tool


async def get_rag_agent(thread_id:str):
    llm = ChatOpenAI(
        api_key=OPEN_API_KEY,
        base_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
        model="qwen-max",
        temperature=0
    )
    retriever = RAG_tool(thread_id)

    if retriever:
        from langchain_core.tools import create_retriever_tool
        rag_tool = create_retriever_tool(
            retriever=retriever,
            name="文档检索",
            description="用于检索用户提出的问题并基于检索到的文档内容进行回复",
        )
        RAG_agent=create_react_agent(
            model=llm,
            tools=[rag_tool],
            prompt="you are a helpful assistant that can answer questions based on the provided documents."
                   "you must search for information by calling tool,you mustn't answer the question without calling tools,"
                   "please do so to find relevant information before answering in Chinese.you must search for information in Chinese, If you cannot find relevant information, please return 'I don't know' instead of answering it by yourself.",
            name="RAG_agent",

        )

        return RAG_agent
    else:
        return None