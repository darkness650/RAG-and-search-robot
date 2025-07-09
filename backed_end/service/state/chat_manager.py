from typing import List

from langchain_core.messages import BaseMessage, HumanMessage, AIMessage, ToolMessage
from langchain_openai import ChatOpenAI


class ChatMemoryManager:
    def __init__(self, max_history=10, summary_threshold=5):
        self.max_history = max_history
        self.summary_threshold = summary_threshold

    def build_messages_content(self, messages: List[BaseMessage]) -> str:
        """
        :param messages:传进来的信息
        :return:
        """
        """将消息列表转换为字符串表示"""
        content_lines = []
        for msg in messages:
            if isinstance(msg, HumanMessage):
                content_lines.append(f"Human: {msg.content}")
            elif isinstance(msg, AIMessage):
                if msg.tool_calls:
                    tool_names = [f"{tc['name']}" for tc in msg.tool_calls]
                    content_lines.append(f"AI: Called tools - {', '.join(tool_names)}")
                else:
                    content_lines.append(f"AI: {msg.content}")
            elif isinstance(msg, ToolMessage):
                content_lines.append(f"Tool ({msg.name}): {msg.content}")
        return "\n".join(content_lines)

    def condense_history(self,
                         messages: List[BaseMessage],
                         llm: ChatOpenAI) -> List[BaseMessage]:
        """压缩历史消息（当消息过多时）"""
        if len(messages) <= self.summary_threshold:
            return messages

        # 创建总结提示
        history_str = self.build_messages_content(messages)
        summary_prompt = (
            "你是一个专业的对话总结助手。请将以下对话历史浓缩成简洁的摘要，"
            "保留重要信息，同时保持对话的上下文连贯性。使用中文回复。\n\n"
            "对话历史：\n"
            f"{history_str}\n\n"
            "总结摘要："
        )

        # 生成总结
        summary = llm.invoke(summary_prompt).content

        # 保留最近的 2 条消息 + 总结
        return [
            AIMessage(content=f"历史总结: {summary}"),
            *messages[-2:]
        ]