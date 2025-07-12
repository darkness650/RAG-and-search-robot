import os
from datetime import datetime

from fastapi import APIRouter, Depends, Form, File, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from backed_end.config.database import get_session
from backed_end.pojo.ChatList import ChatList
from backed_end.pojo.User import User
from backed_end.service.aiservice.aiservice import service
from backed_end.config.user_mannage import get_current_active_user
from typing import Annotated, Optional, List
from backed_end.service.aiservice.history_message import show_history_message
from backed_end.service.userservice import upload_service
router = APIRouter()
@router.post("/chat")
async def ai(question: Annotated[str,Form()],user:Annotated[User,Depends(get_current_active_user)],
             session: Annotated[AsyncSession, Depends(get_session)],
             web_search:Annotated[bool,Form()]=False,files:Optional[List[UploadFile]]=File(None),
             chat_id: Optional[int] = Form(None)):
    has_file = bool(files and len(files) > 0)
    uploaded_file_paths = []
    if chat_id is None:
        # 没有传chat_id ➔ 创建新的
        statement = select(ChatList).where(ChatList.username == user.username)
        result = await session.execute(statement)
        existing_chats = result.scalars().all()
        chat_count = len(existing_chats) + 1
        chat_id = int(datetime.utcnow().timestamp() * 1000)
        chat_name = f"{user.username}的对话({chat_count})"

        new_chat = ChatList(
            chat_id=chat_id,
            username=user.username,
            chat_name=chat_name,
            created_at=datetime.utcnow()
        )
        session.add(new_chat)
        await session.commit()
    else:
        # 有chat_id ➔ 继续已有对话
        statement = select(ChatList).where(ChatList.chat_id == chat_id)
        result = await session.execute(statement)
        chat = result.scalar_one_or_none()
        chat_name = chat.chat_name if chat else f"{user.username}的对话"
    try:
        if has_file:
            for file in files:
                file_info = upload_service.upload_file_service(file, user.username)
                uploaded_file_paths.append(file_info["filepath"])
                await file.close()

        response_text = await service(question, str(chat_id), web_search, has_file)


    finally:
        for path in uploaded_file_paths:
            try:
                if os.path.exists(path):
                    os.remove(path)
            except Exception as e:
                print(f"❗ Failed to delete file {path}: {e}")

    return {
        "chat_id": chat_id,
        "chat_name": chat_name,
        "history": [
            {
                "role": "ai",
                "content": response_text,
                "timestamp": int(datetime.utcnow().timestamp() * 1000)
            }
        ]
    }

@router.post("/history")
async def history(chat_id: str,user: Annotated[User, Depends(get_current_active_user)],
                  session: Annotated[AsyncSession, Depends(get_session)]):
    history_list = await show_history_message(chat_id)

    # 获取 chat_name
    statement = select(ChatList).where(ChatList.chat_id == int(chat_id))
    result = await session.execute(statement)
    chat = result.scalar_one_or_none()
    chat_name = chat.chat_name if chat else "未知对话"

    return {
        "chat_id": chat_id,
        "chat_name": chat_name,
        "history": history_list
    }