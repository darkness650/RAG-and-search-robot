from fastapi import APIRouter, Depends, Body
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Annotated
from backed_end.pojo.ChatList import RenameChatRequest, DeleteChatRequest, StarChatRequest
from backed_end.pojo.User import User
from backed_end.config.database import get_session
from backed_end.config.user_mannage import get_current_active_user
from backed_end.service.aiservice.chatlist_service import get_chat_list, rename_chat_service, delete_chat_service, \
    star_chat_service

router = APIRouter()


@router.get("/{role}")
async def chat_list(user: Annotated[User, Depends(get_current_active_user)],
                    session: Annotated[AsyncSession, Depends(get_session)],
                    role: str):
    return await get_chat_list(user, session,role)


@router.patch("/rename")
async def rename_chat(data: RenameChatRequest = Body(...),
                      user: User = Depends(get_current_active_user),
                      session: AsyncSession = Depends(get_session)):
    print(f"收到请求数据：{data}")
    return await rename_chat_service(data, user, session)


@router.post("/delete")
async def delete_chat(data: DeleteChatRequest = Body(...),
                      user: User = Depends(get_current_active_user),
                      session: AsyncSession = Depends(get_session)):
    return await delete_chat_service(data, user, session)


@router.patch("/star")
async def star_chat(data: StarChatRequest = Body(...),
                    user: User = Depends(get_current_active_user),
                    session: AsyncSession = Depends(get_session)):
    return await star_chat_service(data, user, session)
