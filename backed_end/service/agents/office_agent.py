import os

from langchain_core.tools import Tool
from langchain_openai import ChatOpenAI
from langgraph.prebuilt import create_react_agent

from backed_end.config.api_key import OPEN_API_KEY
from backed_end.service.tools.office_tools import OfficeWriterTool
from backed_end.service.tools.translation_tools import get_translation_message


def get_office_agent():
    llm = ChatOpenAI(
        api_key=OPEN_API_KEY,
        base_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
        model="qwen-max",
        temperature=0
    )
    tools=[OfficeWriterTool(),
           Tool(
            func=get_translation_message,
            name="translation tool",
            description="""
            翻译文档，
        输入应为 JSON 字符串，包含："
        "thread_id": 会话id，主管会给, 
        输入样例：
        {
            "thread_id": "2", 
        }
        """ )]
    office_agent=create_react_agent(
        model=llm,
        tools=tools,
        name="translation and office agent",
        prompt="""
            you are a translate and office agent
            it may give you a json string like {{"thread_id": thread_id}},please parse it and get thread_id value
            you must get thread_id from monitor
            and then pass the thread_id value to the translation tool
            you mustn't pass the json string {{"thread_id": thread_id}} as args,you can only pass the thread_id value
            you must make sure that the thread_id isn't a json string,just a string value
            
               you mustn't transfer back to monitor before you finish your job
               you must use the tool to translate the document and output the content to local document
               you mustn't call the office tool directly,you must try to translate the document 
               to use the translation tool,you must give it thread_id which user give you
               you mustn't generate extra content
               当你调用office tool的时候，请确保你输入给office tool的json字符串中所有的引号均为双引号,若未指定文件名则由你自行决定，文件类型默认为docx
               when you call the office tool,you should pass a string list as content,every "/n" can be the end of paragraph
               when you call the office tool,please pass it the json string as args
               ,"""

    )
    return office_agent

if __name__ == '__main__':
    agent = get_office_agent()
    output=agent.invoke({"messages":"thread_id为2,语言为中文，帮我输出到文件"})
    print(output)