from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
from typing import Annotated, List
from backed_end.pojo.ChatList import ChatList
from backed_end.pojo.User import User
from backed_end.config.database import get_session
from backed_end.config.user_mannage import get_current_active_user


async def get_chat_list(user: Annotated[User, Depends(get_current_active_user)],
                        session: Annotated[AsyncSession, Depends(get_session)]):
    # 如果是admin，查看全部
    if user.role == "admin":
        statement = select(ChatList).order_by(ChatList.created_at.desc())
    else:
        statement = select(ChatList).where(ChatList.username == user.username).order_by(ChatList.created_at.desc())

    result = await session.execute(statement)
    chat_list = result.scalars().all()
    return [
        {"chat_id": chat.chat_id, "chat_name": chat.chat_name, "created_at": chat.created_at.isoformat()}
        for chat in chat_list
    ]