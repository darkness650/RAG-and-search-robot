import requests
import time
from urllib.parse import quote

def reliable_duckduckgo_search(query, max_results=10, delay=1.5, get_result_func=None, max_retries=3, interval=1.5):
    """
    更可靠的 DuckDuckGo 搜索实现，支持异步 request_id 轮询。
    如果返回结果中有 request_id，则自动轮询获取最终内容。
    """
    # 使用 DuckDuckGo 的文本搜索 API
    base_url = "https://html.duckduckgo.com/html/"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml",
        "Referer": "https://duckduckgo.com/"
    }
    params = {"q": query, "kl": "us-en"}

    try:
        time.sleep(delay)
        response = requests.get(
            base_url,
            params=params,
            headers=headers,
            timeout=15
        )
        response.raise_for_status()

        # 检查是否被限速
        if "Ratelimit" in response.text:
            raise RatelimitException("DuckDuckGo 速率限制")

        # 解析结果
        results = parse_ddg_results(response.text, max_results)
        # 检查是否为异步返回
        if isinstance(results, dict) and "request_id" in results and get_result_func:
            request_id = results["request_id"]
            for _ in range(max_retries):
                time.sleep(interval)
                res = get_result_func(request_id)
                if res and isinstance(res, dict) and "answer" in res:
                    return res["answer"]
                if res and isinstance(res, dict) and "result" in res:
                    return res["result"]
            return "查询超时，请稍后重试。"
        if results and isinstance(results, list) and 'error' not in results[0]:
            first = results[0]
            return f"{first['title']}：{first['content']}（{first['url']}）"
        return results
    except Exception as e:
        # 回退到备用搜索引擎
        return fallback_search(query) or [{'error': f"搜索失败: {str(e)}"}]


def parse_ddg_results(html, max_results):
    """解析 DuckDuckGo HTML 搜索结果"""
    from bs4 import BeautifulSoup
    soup = BeautifulSoup(html, 'html.parser')
    results = []

    # 查找结果容器
    for result in soup.select('.results .result')[:max_results]:
        try:
            title_elem = result.select_one('.result__title a')
            snippet_elem = result.select_one('.result__snippet')
            url_elem = result.select_one('.result__url')

            if title_elem and snippet_elem:
                title = title_elem.text.strip()
                snippet = snippet_elem.text.strip()
                url = url_elem['href'] if url_elem and 'href' in url_elem.attrs else ""

                # 清理URL（DuckDuckGo使用重定向链接）
                if url.startswith("//duckduckgo.com/l/?uddg="):
                    url = extract_original_url(url)

                results.append({
                    'title': title,
                    'url': url,
                    'content': snippet
                })
        except Exception:
            continue

    return results or [{'error': '未找到结果'}]


def extract_original_url(uddg_url):
    """从 DuckDuckGo 重定向URL提取原始URL"""
    from urllib.parse import unquote, urlparse, parse_qs
    parsed = urlparse(uddg_url)
    query = parse_qs(parsed.query)
    return unquote(query.get('uddg', [''])[0]) if 'uddg' in query else uddg_url


def fallback_search(query):
    """备用搜索引擎（使用Google）"""
    try:
        # 简单示例 - 实际应用中应使用Google API
        return [{
            'title': f"备用结果: {query}",
            'url': f"https://www.google.com/search?q={quote(query)}",
            'content': "由于DuckDuckGo限制，使用Google搜索结果"
        }]
    except Exception:
        return None


def make_async_search_tool(tool_func, get_result_func, name="async_search_tool", description="异步搜索工具，自动轮询返回最终内容", max_retries=10, interval=1.5):
    """
    生成一个可直接用作 Tool 的异步搜索工具，自动轮询 request_id 并返回最终内容。
    """
    def wrapped(query, *args, **kwargs):
        result = tool_func(query, *args, **kwargs)
        if isinstance(result, dict) and "request_id" in result:
            request_id = result["request_id"]
            for _ in range(max_retries):
                time.sleep(interval)
                res = get_result_func(request_id)
                if res and isinstance(res, dict) and "answer" in res:
                    return res["answer"]
                if res and isinstance(res, dict) and "result" in res:
                    return res["result"]
            return "查询超时，请稍后重试。"
        return result



# 自定义异常
class RatelimitException(Exception):
    pass

