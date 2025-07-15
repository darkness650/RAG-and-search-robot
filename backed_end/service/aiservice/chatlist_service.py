from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import desc
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
from typing import Annotated, List
from backed_end.pojo.ChatList import ChatList, RenameChatRequest, DeleteChatRequest, StarChatRequest
from backed_end.pojo.User import User
from backed_end.config.database import get_session
from backed_end.config.user_mannage import get_current_active_user


async def get_chat_list(user: Annotated[User, Depends(get_current_active_user)],
                        session: Annotated[AsyncSession, Depends(get_session)]):
    # 如果是admin，查看全部
    if user.role == "admin":
        statement = (
            select(ChatList)
            .order_by(desc(ChatList.is_starred), desc(ChatList.created_at))
        )
    else:
        statement = (
            select(ChatList)
            .where(ChatList.username == user.username)
            .order_by(desc(ChatList.is_starred), desc(ChatList.created_at))
        )

    result = await session.execute(statement)
    chat_list = result.scalars().all()
    return [
        {
            "chat_id": chat.chat_id,
            "chat_name": chat.chat_name,
            "created_at": chat.created_at.isoformat(),
            "is_starred": chat.is_starred,
        }
        for chat in chat_list
    ]


async def rename_chat_service(data: RenameChatRequest, user: Annotated[User, Depends(get_current_active_user)],
                              session: Annotated[AsyncSession, Depends(get_session)]):
    statement = select(ChatList).where(ChatList.chat_id == data.chat_id)
    result = await session.execute(statement)
    chat = result.scalar_one_or_none()

    if chat is None:
        raise HTTPException(status_code=404, detail="Chat not found")

    # 权限检查：仅允许本人或admin修改
    if chat.username != user.username and user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to rename this chat")

    chat.chat_name = data.new_name
    session.add(chat)
    await session.commit()
    return {"message": "Chat name updated successfully"}


async def delete_chat_service(data: DeleteChatRequest, user: Annotated[User, Depends(get_current_active_user)],
                              session: Annotated[AsyncSession, Depends(get_session)]):
    statement = select(ChatList).where(ChatList.chat_id == data.chat_id)
    result = await session.execute(statement)
    chat = result.scalar_one_or_none()

    if chat is None:
        raise HTTPException(status_code=404, detail="Chat not found")

    # 权限检查
    if chat.username != user.username and user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to delete this chat")

    await session.delete(chat)
    await session.commit()
    return {"message": "Chat deleted successfully"}


async def star_chat_service(data: StarChatRequest, user: Annotated[User, Depends(get_current_active_user)],
                            session: Annotated[AsyncSession, Depends(get_session)]):
    statement = select(ChatList).where(ChatList.chat_id == data.chat_id)
    result = await session.execute(statement)
    chat = result.scalar_one_or_none()

    if chat is None:
        raise HTTPException(status_code=404, detail="Chat not found")

    if chat.username != user.username and user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to star this chat")

    chat.is_starred = data.starred
    await session.commit()
    return {"message": "Star status updated"}
