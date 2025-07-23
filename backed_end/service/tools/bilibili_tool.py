from langchain_community.document_loaders import BiliBiliLoader


sessdata="86590dce%2C1768576781%2C265b6%2A72CjBbgceNLQDFXd0vxCAlD34iPgNFLjNGYo7Ed6cdNqAbLm7nKjpkiRvFL_vx2t2kD18SVlZKREhWNHpVc0I0Ni05UFdaSHpiSTNHNm1kdXVQbXBTQ1ZjdUtCM20yUWNGZHBuLWcxeGNoaUhfWUZLR19aOVZYeUJfZVRXYTlXN2V1dG1XSnptYk5RIIEC"
bili_jct="0bdfcf33353d35cc283b5d7f48071325"
buvid3="3CEE98D8-4E95-7C42-B186-979DDFBFCC3B64960infoc"
def get_bilibili_tool(url:str):
    """加载Bilibili视频字幕/内容。输入应为视频URL。"""
    loader = BiliBiliLoader(video_urls=[url],
                            bili_jct=bili_jct,
                            sessdata=sessdata,
                            buvid3=buvid3)  # 实例化加载器
    docs = loader.load()
    # 返回处理后的内容（示例：合并所有文本）
    return "\n\n".join(doc.page_content for doc in docs)


