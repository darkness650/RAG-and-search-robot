from fastapi import Depends, HTTPException
from sqlmodel import  select
from typing import Annotated, Optional
from backed_end.config.database import get_session
from backed_end.config.config import ALGORITHM, SECRET_KEY
from jose import JWTError,jwt
from backed_end.pojo.User import User
from backed_end.config import psw_manage
from sqlmodel.ext.asyncio.session import AsyncSession
from backed_end.config.security import oauth2_scheme


async def get_user(session: AsyncSession, username: str) -> Optional[User]:
    statement = select(User).where(User.username == username)
    result = await session.exec(statement)
    return result.first()


# 在数据库中查找用户，并比较密码是否相同，返回用户
async def authenticate_user(session: AsyncSession, username: str, password: str):
    db_user = await get_user(session, username)
    if not db_user:
        return None
    if not psw_manage.verify_password(password, db_user.hashed_password):
        return None
    return db_user


# 获得现在的用户
async def get_current_user(token: Annotated[str, Depends(oauth2_scheme)],
                           session: Annotated[AsyncSession, Depends(get_session)]):
    credentials_exception = HTTPException(
        status_code=401,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    user = await get_user(session, username=username)
    if user is None:
        raise credentials_exception
    return user


# 获得现在的已激活的用户
async def get_current_active_user(
    current_user: Annotated[User, Depends(get_current_user)],
):
    if current_user.disabled:
        raise HTTPException(status_code=403, detail="Inactive user")
    return current_user


# 获得管理员
async def get_current_admin_user(current_user: User = Depends(get_current_active_user)):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="Insufficient permissions"
        )
    return current_user