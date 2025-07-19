from datetime import timedelta
from random import random
from sqlmodel import select
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from backed_end.config.config import ACCESS_TOKEN_EXPIRE_MINUTES
from backed_end.config.database import get_session, redis_client
from backed_end.config.token_manage import create_access_token
from backed_end.pojo.EmailLogin import EmailLogin
from backed_end.pojo.Token import Token
from sqlmodel.ext.asyncio.session import AsyncSession
from backed_end.service.userservice.token_service import login_for_access_token, send_login_code_service, \
    login_by_code_service

router = APIRouter()

@router.post("/",response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends(),
    session: AsyncSession = Depends(get_session)):
    return await login_for_access_token(form_data, session)


@router.post("/send_login_code")
async def send_login_code(email: str):
    return await send_login_code_service(email)

@router.post("/login_by_code", response_model=Token)
async def login_by_code(data: EmailLogin, session: AsyncSession = Depends(get_session)):
    return await login_by_code_service(data, session)

