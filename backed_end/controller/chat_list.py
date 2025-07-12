from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
from typing import Annotated, List
from backed_end.pojo.ChatList import ChatList
from backed_end.pojo.User import User
from backed_end.config.database import get_session
from backed_end.config.user_mannage import get_current_active_user
from backed_end.service.aiservice.chatlist_service import get_chat_list

router = APIRouter()

@router.get("/")
async def chat_list(user: Annotated[User, Depends(get_current_active_user)],
                        session: Annotated[AsyncSession, Depends(get_session)]):
    return await get_chat_list(user, session)
