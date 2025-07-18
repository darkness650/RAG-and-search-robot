from langchain_community.document_loaders import BiliBiliLoader


sessdata="4669bfdc%2C1768306980%2Cf2968%2A72CjCdJ_L1VKkMBNayrmjHip9mQnhGKCm6LxnABqbE3sLQlJDATFi3uCk2WepwinyqC0USVkFtQ1hROFpCREs1aXhsR0ZEaW5LZ05tMUprM2R4Nmh5bkhVLVNuTVJsV1kwWjJROTV3RzNOR3prR1ZEemNuWndwY0JGMklqbjlDQkh6d0xNSlViSjF3IIEC"
bili_jct="1106c30b86621da284e749c49aea0a6a"
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


