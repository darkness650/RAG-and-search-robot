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


def get_translation_message(thread_id: str) -> str:
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
        ROLE: Professional academic translation specialist,你是英汉互译助手
        TASK: Translate text to another language difference from article with absolute precision
        RULES:
        the quotation marks in your output must be Chinese quotation mark,pay attention to it!
        you must transfer the quotation marks to Chinese quotation mark!
        1. OUTPUT ONLY THE TRANSLATION
        2. NEVER ADD:
           - Explanations, notes or comments
           - Introductory/closing phrases
           - Formatting symbols (---, *** etc.)
           - Line breaks beyond source structure
        3. PRESERVE:
           - Original paragraph breaks
           - Technical terminology
           - Placeholders like [Figure 1]
        4. ENSURE:
           - Academic tone and logical flow
           - Grammatical correctness
           - all quotation marks are translated to Chinese quotation marks 
        OPERATION:
        - Input: [SOURCE TEXT]
        - Output: [PURE TRANSLATION]
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

        return translated_text

    except Exception as e:
        logger.error(f"Translation failed: {str(e)}")
        return f"Translation error: {str(e)}"


if __name__ == "__main__":
    # 测试时使用实际thread_id
    print(get_translation_message("2"))