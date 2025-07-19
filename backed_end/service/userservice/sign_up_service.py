from fastapi import HTTPException

from backed_end.config.database import redis_client
from backed_end.pojo.UserCreate import UserCreate, UserRegister
from backed_end.service.userservice.user_service import create_user_service

async def sign_up_service(user_create:UserCreate,session):
    return await create_user_service(user_create,session)

async def sign_up_by_code_service(user_register:UserRegister,session):
    redis_key = f"verify_code:{user_register.email}"
    real_code = redis_client.get(redis_key)
    if not real_code:
        raise HTTPException(status_code=400, detail="验证码已过期或不存在")
    if real_code != user_register.code:
        raise HTTPException(status_code=400, detail="验证码错误")
    # 验证通过，注册用户
    user_create = UserCreate(
        username=user_register.username,
        password=user_register.password,
        email=user_register.email
    )
    user = await sign_up_service(user_create, session)
    # 清除验证码
    redis_client.delete(redis_key)

    return {"message": "注册成功", "user": user.username}

