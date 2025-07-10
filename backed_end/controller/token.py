from fastapi import APIRouter, Depends
from fastapi.security import OAuth2PasswordRequestForm
from backed_end.config.database import get_session
from backed_end.pojo.Token import Token
from sqlmodel.ext.asyncio.session import AsyncSession
from backed_end.service.userservice.token_service import login_for_access_token

router = APIRouter()

@router.post("/",response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends(),
    session: AsyncSession = Depends(get_session)):
    return await login_for_access_token(form_data, session)