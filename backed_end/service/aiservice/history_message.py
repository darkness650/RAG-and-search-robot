from langgraph.checkpoint.sqlite import SqliteSaver
from langgraph.checkpoint.sqlite.aio import AsyncSqliteSaver


async def show_history_message(session_id: str)->list:
    db_path=r"../service/SQLite/checkpoints.sqlite"
    async with AsyncSqliteSaver.from_conn_string(db_path) as checkpointer:
        history_generator = checkpointer.alist({"configurable": {"thread_id": session_id}})
        history = [message async for message in history_generator]
        conversation = []
        if history:
            checkpoint = history[0].checkpoint
        else:return []
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

        return conversation