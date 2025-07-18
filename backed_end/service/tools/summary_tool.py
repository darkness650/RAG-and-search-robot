import logging
import os

from langchain_core.messages import SystemMessage, HumanMessage
from langchain_openai import ChatOpenAI

from backed_end.config.api_key import OPEN_API_KEY
from backed_end.service.tools.load_docs import load_docs

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
def get_summary_tool(thread_id:str):
    """
    获取论文内容的总结

    Args:
        thread_id: 文档标识符

    Returns:
        总结后的纯文本内容
    """
    logger.info("Summary tool called")
    try:
        # 初始化模型
        llm = ChatOpenAI(
            api_key=OPEN_API_KEY,
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

        # 构建英文论文总结提示词
        system_prompt = """
ROLE: Professional Academic Research Assistant specializing in paper summarization
TASK: Generate a structured summary of academic papers, extracting core content
RULES:
1. OUTPUT ONLY THE SUMMARY CONTENT
2. NEVER ADD:
   - Explanatory text, notes or comments
   - Introductory/closing phrases
   - Formatting symbols (e.g., ---, ***)
   - Unnecessary line breaks
3. PRESERVE CRITICAL ELEMENTS:
   - Research objectives and background
   - Core methodology
   - Key findings and results
   - Significant conclusions and implications
4. ENSURE:
   - Academic rigor and logical coherence
   - Accuracy of technical terminology
   - Reference to important data/figures (e.g., [Figure 1])

STRUCTURE:
1. Research Background (1-2 sentences)
2. Methodology (1-2 sentences)
3. Key Findings (3-5 bullet points)
4. Main Conclusions (1-2 sentences)
5. Significance/Implications (1 sentence)

OPERATION:
- Input: [PAPER CONTENT]
- Output: [STRUCTURED SUMMARY]
"""

        # 构建消息链
        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=f"PAPER SUMMARY TASK:\n{source_text}")
        ]

        # 获取总结结果
        response = llm.invoke(messages)
        summarized_text = response.content.strip()
        logger.info(f"Successfully generated summary (length: {len(summarized_text)} chars)")

        return summarized_text

    except Exception as e:
        logger.error(f"Summarization failed: {str(e)}")
        return f"Summarization error: {str(e)}"

    except Exception as e:
        logger.error(f"Translation failed: {str(e)}")
        return f"Translation error: {str(e)}"



