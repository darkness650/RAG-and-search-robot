import uuid
from datetime import timedelta
from random import random
from typing import Annotated
from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from backed_end.config.database import get_session, redis_client
from backed_end.config.token_manage import create_access_token
from backed_end.config.user_mannage import authenticate_user
from backed_end.config.config import ACCESS_TOKEN_EXPIRE_MINUTES
from backed_end.pojo.EmailLogin import EmailLogin
from backed_end.pojo.Token import Token
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlmodel import select

from backed_end.pojo.User import User
from backed_end.service.userservice.email_service import sendemail


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
    session_id = str(uuid.uuid4())
    redis_client.set(f"session:{user.username}", session_id)
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username,
              "role": user.role,
              "session_id": session_id},
        expires_delta=access_token_expires
    )
    return Token(access_token=access_token, token_type="bearer")


async def send_login_code_service(email: str):
    # 1分钟发送限制
    lock_key = f"login_lock:{email}"
    if redis_client.exists(lock_key):
        raise HTTPException(status_code=429, detail="请求过于频繁，请稍后再试")
    redis_client.setex(lock_key, 60, "locked")
    # 生成验证码
    code = str(random.randint(100000, 999999))
    redis_client.setex(f"login_code:{email}", 600, code)
    # 发送邮件
    sendemail(
        email=email,
        subject="登录验证码",
        body=f"您的登录验证码是：{code}，10分钟内有效。"
    )
    return {"message": "验证码已发送，请查收邮箱"}



async def login_by_code_service(data: EmailLogin, session: AsyncSession = Depends(get_session)):
    redis_key = f"login_code:{data.email}"
    real_code = redis_client.get(redis_key)
    if not real_code:
        raise HTTPException(status_code=400, detail="验证码已过期或不存在")
    if real_code != data.code:
        raise HTTPException(status_code=400, detail="验证码错误")
    # 查找用户
    statement = select(User).where(User.email == data.email)
    result = await session.exec(statement)
    user = result.first()
    if not user:
        raise HTTPException(status_code=404, detail="该邮箱未注册")
    # 清除验证码
    redis_client.delete(redis_key)
    # 创建 access_token（sub = username）
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username, "role": user.role},
        expires_delta=access_token_expires
    )
    return Token(access_token=access_token, token_type="bearer")