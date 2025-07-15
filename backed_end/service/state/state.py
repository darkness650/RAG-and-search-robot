import os
from typing import Annotated
from typing import Sequence

from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI
from langgraph.graph.message import _format_messages
from langgraph.managed import IsLastStep, RemainingSteps
from typing_extensions import TypedDict

# 初始化LLM用于总结生成
SUMMARY_LLM = ChatOpenAI(
            api_key=os.getenv("OPEN_API_KEY"),
            base_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
            model="deepseek-r1",
            temperature=0.5
        )


# def custom_state_updater(
#         old_state: Sequence[BaseMessage],
#         new_state: Sequence[BaseMessage]
# ) -> List[BaseMessage]:
#     """
#     自定义状态更新器，当消息总数超过阈值时自动总结历史消息
#
#     规则:
#     1. 合并新旧消息
#     2. 如果总消息数 > 5：
#         - 保留最近的2条原始消息
#         - 总结之前的所有消息
#         - 返回 [总结消息] + [最近2条消息]
#     3. 否则直接返回合并后的消息
#
#     特殊处理:
#     - 系统消息始终保留在开头
#     - 避免总结消息被再次总结
#     - 处理混合类型的消息序列
#     """
#     # 1. 合并消息并转换为列表以便修改
#     combined: List[BaseMessage] = list(old_state) + list(new_state)
#
#
#     # 2. 分离系统消息（始终保留在开头）
#     system_messages = [msg for msg in combined if isinstance(msg, SystemMessage)]
#     other_messages = [msg for msg in combined if not isinstance(msg, SystemMessage)]
#
#     # 3. 检查是否需要总结（排除系统消息）
#     if len(other_messages) <= 5:
#
#         return system_messages + other_messages
#
#
#
#     # 4. 识别并保留最近的2条非总结消息
#     # 反向查找最近的2条原始消息（非总结消息）
#     recent_messages = []
#     count = 0
#     for msg in reversed(other_messages):
#         if not _is_summary_message(msg):
#             recent_messages.insert(0, msg)  # 插入到开头保持顺序
#             count += 1
#             if count >= 2:
#                 break
#
#     # 5. 获取需要总结的消息（排除系统消息和最近2条）
#     to_summarize = [
#         msg for msg in other_messages
#         if msg not in recent_messages and not _is_summary_message(msg)
#     ]
#
#     # 6. 生成总结
#     try:
#         summary = _generate_summary(to_summarize)
#
#     except Exception as e:
#
#         # 失败时回退到保留最近5条消息
#         return system_messages + other_messages[-5:]
#
#     # 7. 构建最终消息序列
#     return system_messages + [summary] + recent_messages
#
#
# def _is_summary_message(message: BaseMessage) -> bool:
#     """检查是否为总结消息"""
#     return (
#             isinstance(message, AIMessage) and
#             hasattr(message, 'content') and
#             ("[SUMMARY]" in message.content or "summary]" in message.content.lower())
#     )
#
#
# def _generate_summary(messages: Sequence[BaseMessage]) -> AIMessage:
#     """使用LLM生成对话总结"""
#     # 确保消息格式正确
#     valid_messages = []
#     for msg in messages:
#         if isinstance(msg, BaseMessage) and hasattr(msg, 'content'):
#             valid_messages.append(msg)
#         elif isinstance(msg, dict) and 'content' in msg:
#             # 处理可能的字典格式消息
#             role = msg.get('role', 'user')
#             if role == 'user':
#                 valid_messages.append(HumanMessage(content=msg['content']))
#             else:
#                 valid_messages.append(AIMessage(content=msg['content']))
#
#     # 生成总结提示
#     summary_prompt = (
#         "请用中文总结以下对话内容，保留所有重要信息和细节：\n\n"
#         f"{get_buffer_string(valid_messages)}\n\n"
#         "总结要点："
#     )
#
#     # 使用LLM生成总结
#     result = SUMMARY_LLM.invoke(summary_prompt)
#
#     # 创建总结消息并标记
#     return AIMessage(content=f"[SUMMARY] {result.content}")
import uuid
from typing import List, Literal, Union
from langchain_core.messages import (
    AIMessage,
    BaseMessage,
    HumanMessage,
    SystemMessage,
    messages_to_dict,
)



# 假设已经有一个可以调用AI进行总结的函数
# 你需要根据自己使用的LLM模型来实现这个函数
def summarize_messages(messages: List[BaseMessage]) -> str:
    """调用AI总结历史消息"""
    # 示例实现，实际需要替换为真实的LLM调用
    # 例如：


    chat = SUMMARY_LLM
    summary_prompt = ChatPromptTemplate.from_messages([
        ("system", "请总结以下对话，保留关键信息："),
        ("human", "{messages}")  # {messages}为占位符，运行时传入实际消息
    ])
    chain= summary_prompt | chat | StrOutputParser()
    response = chain.invoke(summary_prompt)
    return response




def update_messages(
        messages: List[BaseMessage],
        new_message: Union[BaseMessage, List[BaseMessage]],
        *,
        format: Literal["langchain-openai"] | None = None,
        summary_threshold: int = 10,
) -> List[BaseMessage]:
    """更新消息列表，当消息数量超过阈值时自动总结历史消息

    Args:
        messages: 历史消息列表
        new_message: 新消息或消息列表
        format: 消息格式，同add_messages函数
        summary_threshold: 触发总结的消息数量阈值，默认为5

    Returns:
        更新后的消息列表
    """
    # 将新消息转换为列表
    if not isinstance(new_message, list):
        new_message = [new_message]

    # 合并新旧消息（使用类似add_messages的逻辑）
    merged = messages.copy()
    for msg in new_message:
        merged.append(msg)

    # 检查是否需要总结
    if len(merged) > summary_threshold:
        # 提取需要总结的历史消息（保留最新的user和ai消息）
        # 通常最新的user消息是当前问题，最新的ai消息是最新回复
        latest_user_message = None
        latest_ai_message = None

        # 从后往前找最新的user和ai消息
        for msg in reversed(merged):
            if isinstance(msg, HumanMessage) and latest_user_message is None:
                latest_user_message = msg
            elif isinstance(msg, AIMessage) and latest_ai_message is None:
                latest_ai_message = msg
            # 如果两个都找到了就提前结束
            if latest_user_message is not None and latest_ai_message is not None:
                break

        # 提取需要总结的消息（不包括最新的user和ai消息）
        messages_to_summarize = []
        for msg in merged:
            if msg is latest_user_message or msg is latest_ai_message:
                continue
            messages_to_summarize.append(msg)

        # 调用AI进行总结
        summary_text = summarize_messages(messages_to_summarize)

        # 创建总结消息（使用SystemMessage类型，表示这是系统提供的上下文）
        summary_message = SystemMessage(
            content=f"历史对话总结：{summary_text}",
            id=str(uuid.uuid4())
        )

        # 构建新的消息列表：总结消息 + 最新的user消息 + 最新的ai消息 + 新添加的消息
        new_messages = [summary_message]
        if latest_user_message is not None:
            new_messages.append(latest_user_message)
        if latest_ai_message is not None:
            new_messages.append(latest_ai_message)

        # 添加new_message中不在merged中的消息（处理new_message是多条消息的情况）
        for msg in new_message:
            if msg not in merged:
                new_messages.append(msg)

        merged = new_messages

    # 格式化消息（如果需要）
    if format == "langchain-openai":
        merged = _format_messages(merged)  # 假设_format_messages函数存在
    elif format:
        raise ValueError(f"Unrecognized {format=}. Expected one of 'langchain-openai', None.")

    return merged
class State(TypedDict):
    messages: Annotated[Sequence[BaseMessage],update_messages]

    is_last_step: IsLastStep

    remaining_steps: RemainingSteps

