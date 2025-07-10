from fastapi import HTTPException
from backed_end.config import user_crud
from backed_end.pojo.UserCreate import UserCreate

async def get_all_users_service():
    return await user_crud.get_all_users()

async def get_user_by_id_service(user_id: int):
    user = await user_crud.get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="用户未找到")
    return user

async def create_user_service(user_create: UserCreate,session):
    return await user_crud.create_user(user_create,session)

async def delete_user_service(user_id: int):
    user = await user_crud.delete_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="用户未找到")
    return user

