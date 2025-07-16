from langchain_community.agent_toolkits import PlayWrightBrowserToolkit
from playwright.async_api import async_playwright

async def get_browser_tools():
    playwright = await async_playwright().start()  # ✅ 直接 await，不涉及事件循环嵌套
    browser = await playwright.chromium.launch()
    # ignore_default_args=True,
    # args=["--disable-http2"] ) # 关键：强制使用 HTTP/1.1)
    toolits = PlayWrightBrowserToolkit(async_browser=browser)
    tools = toolits.get_tools()
    async_tools = [tool for tool in tools if hasattr(tool, "arun")]
    return async_tools


# from playwright.sync_api import sync_playwright
# from langchain_community.agent_toolkits import PlayWrightBrowserToolkit
# from concurrent.futures import ThreadPoolExecutor
# import asyncio
#
# executor = ThreadPoolExecutor(max_workers=1)
#
# def get_browser_tools_sync_blocking():
#     with sync_playwright() as playwright:
#         browser = playwright.chromium.launch(headless=True)
#         toolkit = PlayWrightBrowserToolkit(sync_browser=browser)
#         tools = toolkit.get_tools()
#         sync_tools = [tool for tool in tools if hasattr(tool, "run")]
#         return sync_tools
#
# async def get_browser_tools():
#     loop = asyncio.get_event_loop()
#     return await loop.run_in_executor(executor, get_browser_tools_sync_blocking)