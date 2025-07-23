import os
import logging
from langchain_core.messages import SystemMessage, HumanMessage
from langchain_openai import ChatOpenAI

from backed_end.config.api_key import OPEN_API_KEY
from backed_end.service.tools.handle_file import handle_file
from backed_end.service.tools.load_docs import load_docs

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def get_translation_message(thread_id: str) :
    """
    获取论文内容的纯翻译文本

    Args:
        thread_id: 文档标识符

    Returns:
        翻译后的纯文本内容
    """
    logger.info("已调用")
    try:
        # 初始化模型
        llm = ChatOpenAI(
            api_key=OPEN_API_KEY,  # 修正环境变量名
            base_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
            model="deepseek-r1",
            temperature=0
        )

        # 加载文档内容
        docs = load_docs(thread_id)
        if not docs:
            logger.warning(f"No documents found for thread_id: {thread_id}")
            return ""

        # 合并文档内容
        source_text = "\n\n".join(doc.page_content for doc in docs)
        logger.info(f"Loaded source text with {len(docs)} documents")

        # 构建严格翻译提示词
        system_prompt = f"""
        角色：专业学术翻译专家，你是英汉互译助手
任务：将文本精确翻译为不同于原文的语言
规则：
1.  输出仅包含译文
2.  切勿添加：
    *   解释、注释或评论
    *   开头/结尾语
    *   格式符号（---、*** 等）
    *   超出原文结构的换行
3.  保留：
    *   将原始段落分割变为换行符（\n)
    *   专业术语
    *   占位标记（如 [图 1]）
4.  确保：
    *   学术语调和逻辑连贯性
    *   语法正确性
    *   **所有引号均转换为中文引号（“”和‘’）！**
操作：
*   输入：[源文本]
*   输出：[纯译文]
        """

        # 构建消息链
        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=f"TRANSLATION TASK:\n{source_text}")
        ]

        # 获取翻译结果
        response = llm.invoke(messages)
        translated_text = response.content.strip()
        logger.info(f"Successfully translated text (length: {len(translated_text)} chars)")

        return translated_text.split("\n")

    except Exception as e:
        logger.error(f"Translation failed: {str(e)}")
        return f"Translation error: {str(e)}"


if __name__ == "__main__":
    # 测试时使用实际thread_id
    output=get_translation_message("1")
    for msg in output:
        print(msg)