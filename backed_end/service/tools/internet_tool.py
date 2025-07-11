from langchain_community.agent_toolkits import PlayWrightBrowserToolkit
from langchain_community.tools.playwright.utils import create_async_playwright_browser
from playwright.async_api import async_playwright


async def gettools():
    playwright = await async_playwright().start()  # ✅ 直接 await，不涉及事件循环嵌套
    browser = await playwright.chromium.launch()
        # ignore_default_args=True,
        # args=["--disable-http2"] ) # 关键：强制使用 HTTP/1.1)
    toolits = PlayWrightBrowserToolkit(async_browser=browser)
    tools= toolits.get_tools()
    async_tools = [tool for tool in tools if hasattr(tool, "arun")]
    return async_tools