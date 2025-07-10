from langchain_community.agent_toolkits import PlayWrightBrowserToolkit

from langchain_community.tools.playwright.utils import  create_sync_playwright_browser

def gettools():
    sync_broswer = create_sync_playwright_browser()
    toolits = PlayWrightBrowserToolkit(sync_browser=sync_broswer)
    internet_tools = toolits.get_tools()
    return internet_tools