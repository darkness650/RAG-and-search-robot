from datetime import timedelta
from typing import Annotated
from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from backed_end.config.database import get_session
from backed_end.config.token_manage import create_access_token
from backed_end.config.user_mannage import authenticate_user
from backed_end.config.config import ACCESS_TOKEN_EXPIRE_MINUTES
from backed_end.pojo.Token import Token
from sqlmodel.ext.asyncio.session import AsyncSession

async def login_for_access_token(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    session: Annotated[AsyncSession, Depends(get_session)]
) -> Token:
    user =await authenticate_user(session, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=401,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username,
              "role": user.role}, 
        expires_delta=access_token_expires
    )
    return Token(access_token=access_token, token_type="bearer")