from langgraph.checkpoint.sqlite import SqliteSaver
from langgraph.checkpoint.sqlite.aio import AsyncSqliteSaver

from backed_end.config.database import SQLITE_URL


def extract_conversations(messages):
    """
    从多轮会话消息中提取每轮的用户提问和AI最终回答
    :param messages: 消息列表，格式为 [{"role": ..., "content": ...}, ...]
    :return: 列表，包含每轮对话的字典 {"user": 用户消息, "ai": AI最终回答}
    """
    conversations = []  # 存储提取的对话对
    current_user_msg = None  # 当前轮次的用户消息
    ai_responses = []  # 当前轮次收集的AI回复

    for msg in messages:
        role = msg.get("role")
        content = msg.get("content", "").strip()

        # 1. 处理用户消息 - 开始新的一轮对话
        if role == "user" and content:
            # 保存前一轮对话（如果有）
            if current_user_msg is not None and ai_responses:
                # 取最后一个有效的AI回复作为最终回答
                for ai_msg in reversed(ai_responses):
                    if ai_msg and not ai_msg.startswith("Transferring"):
                        conversations.append({
                            "role": "user",
                            "content": current_user_msg,
                            "timestamp": msg.get("timestamp", None)

                        })
                        conversations.append({
                            "role": "ai",
                            "content": ai_msg,
                            "timestamp": msg.get("timestamp", None)
                        })
                        break

            # 开始新的一轮
            current_user_msg = content
            ai_responses = []  # 重置AI回复收集

        # 2. 处理AI消息 - 收集当前轮次的回复
        elif role == "ai" and content:
            # 跳过转接消息和空内容
            if not content.startswith("Transferring"):
                ai_responses.append(content)

    # 处理最后一轮对话
    if current_user_msg is not None and ai_responses:
        for ai_msg in reversed(ai_responses):
            if ai_msg and not ai_msg.startswith("Transferring"):
                conversations.append({
                    "role":"user",
                    "content":current_user_msg,
                    "timestamp": msg.get("timestamp", None)

                })
                conversations.append({
                    "role":"ai",
                    "content": ai_msg,
                    "timestamp": msg.get("timestamp", None)
                })
                break

    return conversations
async def show_history_message(session_id: str)->list:

    async with AsyncSqliteSaver.from_conn_string(SQLITE_URL) as checkpointer:
        history_generator = checkpointer.alist({"configurable": {"thread_id": session_id}})
        history = [message async for message in history_generator]
        conversation = []
        if not history: return []
        checkpoint = history[0].checkpoint
        # 提取消息列表（如果存在）
        if 'channel_values' in checkpoint and 'messages' in checkpoint['channel_values']:
            messages = checkpoint['channel_values']['messages']
            # 处理每条消息
            for msg in messages:
                # 提取消息类型和内容
                if hasattr(msg, 'content'):
                    content = msg.content
                    # 确定消息角色
                    if "HumanMessage" in str(type(msg)):
                        role = "user"
                    elif "AIMessage" in str(type(msg)):
                        role = "ai"
                    else:
                        role = "系统"

                    # 添加到对话历史
                    conversation.append({
                        "role": role,
                        "content": content,
                        "timestamp": checkpoint['ts']
                    })
        messages= extract_conversations(conversation)
        for msg in messages:
            print(msg)
        return messages



