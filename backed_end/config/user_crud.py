from sqlmodel import select
from backed_end.pojo.User import User
from backed_end.config.database import async_session
from backed_end.config.psw_manage import get_password_hash
from backed_end.pojo.UserCreate import UserCreate

async def get_all_users():
    async with async_session() as session:
        result = await session.exec(select(User))
        return result.all()

async def get_user_by_id(user_id: int):
    async with async_session() as session:
        return await session.get(User, user_id)

async def create_user(user_create: UserCreate,session):
    user_data = user_create.model_dump()
    password = user_data.pop("password")
    hashed_pw = get_password_hash(password)
    user = User(**user_data, hashed_password=hashed_pw)
    session.add(user)
    await session.commit()
    await session.refresh(user)
    return user

async def delete_user(user_id: int):
    async with async_session() as session:
        user = await session.get(User, user_id)
        if not user:
            return None
        await session.delete(user)
        await session.commit()
        return user
