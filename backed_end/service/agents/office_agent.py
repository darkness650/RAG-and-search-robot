import os

from langchain_core.tools import Tool
from langchain_openai import ChatOpenAI
from langgraph.prebuilt import create_react_agent

from backed_end.config.api_key import OPEN_API_KEY
from backed_end.service.tools.office_tools import OfficeWriterTool
from backed_end.service.tools.translation_tools import get_translation_message


def get_office_agent(thread_id:str):
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
        输入样例：
         "2", 
        """ )]
    office_agent=create_react_agent(
        model=llm,
        tools=tools,
        name="translation and office agent",
        prompt=f"""
           thread_id为{thread_id}

工作流程要求：

禁止 在完成你的工作之前将控制权交还给监控器。

必须 使用翻译工具翻译文档，并将翻译后的内容输出到一个本地文档中。

禁止 直接调用办公工具（office tool）而不先进行翻译。

要使用翻译工具，必须 将用户（通过监控器）提供的 thread_id 传递给它。

禁止 生成任何额外的内容。

调用办公工具 (office tool) 规范：

当你调用办公工具时：

必须 将翻译工具的输出作为 content 参数传递给办公工具。

content 参数格式要求：

必须是一个字符串列表 (string list)。

列表中的每个元素代表文档中的一个段落。

翻译工具的输出即为应该写入content的字符串列表

传递给办公工具的参数必须是有效的 JSON 字符串。

在构造这个 JSON 字符串时，所有的引号都必须是双引号 (")。

如果没有指定文件名，则由你自行决定文件名。

文件类型默认应为 .docx。
               ,"""

    )
    return office_agent

if __name__ == '__main__':
    agent = get_office_agent()
    output=agent.invoke({"messages":"thread_id为2,语言为中文，帮我输出到文件"})
    print(output)