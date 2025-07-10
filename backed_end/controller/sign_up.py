from backed_end.pojo.UserCreate import UserCreate
from backed_end.service.userservice import sign_up_service
from fastapi import APIRouter, Depends
from backed_end.config.database import get_session
from sqlmodel.ext.asyncio.session import AsyncSession




router = APIRouter()

@router.post("/")
async def sign_up(user_create: UserCreate, session: AsyncSession = Depends(get_session)):
    return await sign_up_service.sign_up_service(user_create,session)