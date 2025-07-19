from backed_end.pojo.UserCreate import UserCreate, UserRegister
from backed_end.service.userservice.sign_up_service import sign_up_service,sign_up_by_code_service
from fastapi import APIRouter, Depends, HTTPException
from backed_end.config.database import get_session
from sqlmodel.ext.asyncio.session import AsyncSession
import random
from backed_end.config.database import redis_client
from backed_end.service.userservice.email_service import sendemail

router = APIRouter()

@router.post("/")
async def sign_up(user_create: UserCreate, session: AsyncSession = Depends(get_session)):
    return await sign_up_service(user_create,session)


@router.post("/by_code")
async def register(user_register: UserRegister, session: AsyncSession = Depends(get_session)):
    return await sign_up_by_code_service(user_register, session)


@router.post("/send_verification_code")
async def send_verification_code(email: str):
    redis_key = f"verify_code:{email}"
    lock_key = f"verify_lock:{email}"
    # 检查发送频率限制
    if redis_client.exists(lock_key):
        raise HTTPException(status_code=429, detail="请求过于频繁，请1分钟后再试")
    else:
        redis_client.setex(lock_key, 60, "locked")  # 设置1分钟锁定
    # 生成验证码
    code = str(random.randint(100000, 999999))
    # 保存验证码，有效期10分钟
    redis_client.setex(redis_key, 600, code)
    # 发送邮件
    sendemail(
        email=email,
        subject="注册验证码",
        body=f"您的注册验证码是：{code}，10分钟内有效。"
    )
    return {"message": "验证码已发送，请查收邮箱"}

