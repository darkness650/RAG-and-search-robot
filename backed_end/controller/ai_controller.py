import os
from datetime import datetime
from fastapi import Query
from fastapi import APIRouter, Depends, Form, File, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
from starlette.responses import StreamingResponse, JSONResponse
from sympy.strategies.core import switch

from backed_end.config.database import get_session
from backed_end.pojo.ChatList import ChatList
from backed_end.pojo.User import User
from backed_end.config.user_mannage import get_current_active_user
from typing import Annotated, Optional, List

from backed_end.service.aiservice.chat_with_roles import chat_with_roles
from backed_end.service.aiservice.graph_service import service
from backed_end.service.aiservice.history_message import show_history_message
from backed_end.service.userservice import upload_service

router = APIRouter()


@router.post("/chat/{model}")
async def ai(question: Annotated[str, Form()], user: Annotated[User, Depends(get_current_active_user)],
             model: str,
             session: Annotated[AsyncSession, Depends(get_session)],
             web_search: Annotated[bool, Form()] = False, files: Optional[List[UploadFile]] = File(None),
             chat_id: Optional[str] = Form(None)):
    has_file = bool(files and len(files) > 0)
    uploaded_file_paths = []
    if chat_id is None:
        # 没有传chat_id ➔ 创建新的
        statement = select(ChatList).where(ChatList.username == user.username)
        result = await session.execute(statement)
        existing_chats = result.scalars().all()
        chat_count = len(existing_chats) + 1
        chat_id = str(int(datetime.utcnow().timestamp() * 1000))
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

        # response_text = await service(question, str(chat_id), model, web_search, has_file)
        async def event_generator():
            async for chunk in service(question, str(chat_id), model, web_search, has_file):
                yield chunk  # 每个 chunk 是一段文本

        return StreamingResponse(event_generator(), media_type="text/event-stream", headers={
            "X-Chat-Id": chat_id
        })


    finally:
        for path in uploaded_file_paths:
            try:
                if os.path.exists(path):
                    os.remove(path)
            except Exception as e:
                print(f"❗ Failed to delete file {path}: {e}")


# @router.post("/newchat/{model}")
# async def newai(question: Annotated[str, Form()], user: Annotated[User, Depends(get_current_active_user)],
#              model: str,
#              session: Annotated[AsyncSession, Depends(get_session)],
#              web_search: Annotated[bool, Form()] = False, files: Optional[List[UploadFile]] = File(None)):
#     has_file = bool(files and len(files) > 0)
#     uploaded_file_paths = []
#     statement = select(ChatList).where(ChatList.username == user.username)
#     result = await session.execute(statement)
#     existing_chats = result.scalars().all()
#     chat_count = len(existing_chats) + 1
#     chat_id = str(int(datetime.utcnow().timestamp() * 1000))
#     chat_name = f"{user.username}的对话({chat_count})"
#
#     new_chat = ChatList(
#         chat_id=chat_id,
#         username=user.username,
#         chat_name=chat_name,
#         created_at=datetime.utcnow()
#     )
#     session.add(new_chat)
#     await session.commit()
#
#     try:
#         if has_file:
#             for file in files:
#                 file_info = upload_service.upload_file_service(file, user.username)
#                 uploaded_file_paths.append(file_info["filepath"])
#                 await file.close()
#
#         # response_text = await service(question, str(chat_id), model, web_search, has_file)
#         async def event_generator():
#             async for chunk in service(question, str(chat_id), model, web_search, has_file):
#                 yield chunk  # 每个 chunk 是一段文本
#
#         return StreamingResponse(event_generator(), media_type="text/event-stream", headers={
#             "X-Chat-Id": chat_id
#         })
#     finally:
#         for path in uploaded_file_paths:
#             try:
#                 if os.path.exists(path):
#                     os.remove(path)
#             except Exception as e:
#                 print(f"❗ Failed to delete file {path}: {e}")


@router.post("/newchat")
async def newai(user: Annotated[User, Depends(get_current_active_user)],
                session: Annotated[AsyncSession, Depends(get_session)],
                role: Optional[str] = Form(None)):
    statement = select(ChatList).where(ChatList.username == user.username).where(ChatList.role == role)
    result = await session.execute(statement)
    existing_chats = result.scalars().all()
    chat_count = len(existing_chats) + 1
    chat_id = str(int(datetime.utcnow().timestamp() * 1000))
    if role is None:
        chat_name = f"{user.username}的对话({chat_count})"
    else:
        role_names = {
            "role1": "琼琚",
            "role2": "红绡仙",
            "role3": "侍女",
            "role4": "铃兰"
        }
        chat_name = f"与{role_names.get(role, '神秘角色')}的对话({chat_count})"

    new_chat = ChatList(
        chat_id=chat_id,
        username=user.username,
        chat_name=chat_name,
        created_at=datetime.utcnow(),
        role = role  # 添加角色信息，如果有的话
    )
    session.add(new_chat)
    await session.commit()

    return JSONResponse(content={"message": "chat_id created"}, headers={
        "X-Chat-Id": chat_id
    })


# return {
#     "chat_id": chat_id,
#     "chat_name": chat_name,
#     "history": [
#         {
#             "role": "ai",
#             "content": response_text,
#             "timestamp": int(datetime.utcnow().timestamp() * 1000)
#         }
#     ]
# }

@router.post("/chat/role/{role}")
async def ai1(question: Annotated[str, Form()], user: Annotated[User, Depends(get_current_active_user)],
              role: str,
              session: Annotated[AsyncSession, Depends(get_session)],
              chat_id: Optional[str] = Form(None)):
    if chat_id is None:
        # 没有传chat_id ➔ 创建新的
        statement = select(ChatList).where(ChatList.username == user.username)
        result = await session.execute(statement)
        existing_chats = result.scalars().all()
        chat_count = len(existing_chats) + 1
        chat_id = str(int(datetime.utcnow().timestamp() * 1000))
        chat_name = f"与{role}的对话({chat_count})"

        new_chat = ChatList(
            chat_id=chat_id,
            username=user.username,
            chat_name=chat_name,
            created_at=datetime.utcnow(),
            role=role  # 添加角色信息
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
        async def event_generator():
            async for chunk in chat_with_roles(question, str(chat_id), role):
                yield chunk  # 每个 chunk 是一段文本

        return StreamingResponse(event_generator(), media_type="text/event-stream", headers={
            "X-Chat-Id": chat_id
        })
    except Exception as e:
        print(f"Error in ai1: {e}")
        return {"error": str(e)}


@router.post("/history")
async def history(user: Annotated[User, Depends(get_current_active_user)],
                  session: Annotated[AsyncSession, Depends(get_session)], chat_id: str = Query(...)):
    history_list = await show_history_message(str(chat_id))

    # 获取 chat_name
    statement = select(ChatList).where(ChatList.chat_id == chat_id)
    result = await session.execute(statement)
    chat = result.scalar_one_or_none()
    chat_name = chat.chat_name if chat else "未知对话"
    print("chat_id", chat_id)
    return {
        "chat_id": chat_id,
        "chat_name": chat_name,
        "history": history_list
    }
