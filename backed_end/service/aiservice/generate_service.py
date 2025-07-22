import asyncio

from langchain_core.tools import Tool
from langchain_openai import ChatOpenAI
from langgraph.prebuilt import create_react_agent

from backed_end.config.api_key import OPEN_API_KEY
from backed_end.config.database import SQLITE_URL
from backed_end.service.checkpointer.AsyncStartEndCheckpointer import AsyncStartEndCheckpointer


from backed_end.service.tools.generate_picture_tool import get_picture
from backed_end.service.tools.generate_video_tool import get_video_tool


async def generate_service(thread_id:str,question:str):
    async with AsyncStartEndCheckpointer.from_conn_string(SQLITE_URL) as checkpointer:
        config = {"configurable": {"thread_id": thread_id}}
        llm = ChatOpenAI(
            api_key=OPEN_API_KEY,
            base_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
            model="qwen-plus",
            temperature=0
        )
        tools = [Tool(
            func=get_video_tool,
            name="generate_video_tool",
            description="""生成视频用的工具，传入thread_id和要生成什么样的视频，返回一个url
                        示例：
                            {
                                "thread_id":"3",
                                "question":"generate a video which describes a cat running in the evening"
                            }"""
        ),
            Tool(
                func=get_picture,
                name="generate_picture_tool",
                description="生成图片用的工具，传入要生成什么样的图片，返回一个url"
            )]
        generate_agent = create_react_agent(
            model=llm,
            tools=tools,
            name="generate_agent",
            prompt=f"""You are a generate picture or video Assistant,here's the question:{question},here's the thread_id:{thread_id}
                        you must pass the description to the tools to generate a picture or video"
                        you mustn't generate a url like "http://example.com/something"or "http://image_generation_service/generate",if you want to generate a url,you must call the tools
                        if you will generate a picture,you must call the generate_picture_tool to get the picture url
                        you are forbidden to generate the image yourself, you are forbidden to return to a url by yourself, 
                        you are forbidden to return the message when the tool is not called.
                        you are forbidden to make up a url to return 
                        After the invoking tool passes the description of the image given by the user to the tool, you gets a URL, 
                        and the result is not allowed to be returned without calling the tool

                        if you will generate an video,you must call the generate_video_tool and pass it the thread_id and question to generate a video
                        you are forbidden to generate the video yourself, you are forbidden to return to a url by yourself, 
                        you are forbidden to return the message when the tool is not called.
                        you are forbidden to make up a url to return 
                        After the invoking tool passes thread_id and the description of the video given by the user to the tool, you gets a URL, 
                        and the result is not allowed to be returned without calling the tool
                        """,
            checkpointer=checkpointer
        )
        async for event in generate_agent.astream_events({"messages":question},config=config):
            if event["event"] == "on_chat_model_stream":
                for chunk in event["data"]["chunk"].content:
                    yield f"data: {chunk}\n\n"
                    #print(chunk, end="", flush=True)
        # output=await generate_agent.ainvoke()
        # print(output["messages"][-1].content)
        # return output["messages"][-1].content

if __name__ == '__main__':
    asyncio.run(generate_service("1","帮我生成一段小狗在阳光下奔跑的视频"))
