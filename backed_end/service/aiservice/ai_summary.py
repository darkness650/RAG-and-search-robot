import os

from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import SystemMessagePromptTemplate
from langchain_openai import ChatOpenAI

from backed_end.config.api_key import OPEN_API_KEY


async def ai_summary(message:str):
    """
    对输入的消息进行摘要处理。
    :param message: 输入的消息内容
    :return: 摘要后的消息内容
    """
    llm = ChatOpenAI(
        api_key=OPEN_API_KEY,
        base_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
        model="deepseek-r1",
        temperature=0.5
    )
    prompt=SystemMessagePromptTemplate.format_messages("你是一个智能助手，你的任务是对输入的消息进行摘要处理。摘要不能超过10个字，请将以下消息内容进行摘要：{message}")
    chain= prompt | llm | StrOutputParser()
    output= await chain.ainvoke({"message": message})
    return output
