from langgraph.checkpoint.sqlite.aio import AsyncSqliteSaver

from backed_end.config.database import SQLITE_URL


async def delete_message(session_id: str, message_id: str) -> bool:
    """
    删除指定会话中的消息
    :param session_id: 会话ID
    :param message_id: 消息ID
    :return: 是否删除成功
    """
    async with AsyncSqliteSaver.from_conn_string(SQLITE_URL) as checkpointer:
        try:
            await checkpointer.adelete_thread(
                thread_id=session_id,
                message_id=message_id
            )
            return True
        except Exception as e:
            print(f"删除消息失败: {e}")
            return False